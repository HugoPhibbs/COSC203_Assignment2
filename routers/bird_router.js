/* Creating Router */
const router = require('express').Router();
const controller = require("../controllers/bird_controller");
const lodash = require("lodash")
const Bird = require("../models/bird")
const fs = require("fs");
const EOL = require("os").EOL
const multer = require("multer")

const consStatuses = [
    "Not Threatened",
    "Naturally Uncommon",
    "Relict",
    "Recovering",
    "Declining",
    "Nationally Increasing",
    "Nationally Vulnerable",
    "Nationally Endangered",
    "Nationally Critical",
    "Data Deficient"
]

/* Setting up multer*/
const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'tmp'),
    filename: (req, file, cb) => cb(null, file.originalname)
})
const photoUpload = multer({storage: photoStorage})


/**
 * Get Birds from DB
 *
 * @returns {Promise<Query<Array<HydratedDocument<unknown, {}, {}>>, Document<unknown, any, unknown> & unknown extends {_id?: infer U} ? IfAny<U, {_id: Types.ObjectId}, Required<{_id: U}>> : {_id: Types.ObjectId}, {}, unknown>>}
 */
async function getBirds() {
    return Bird.find({});
}

/**
 * Finds a bird with a given ID
 *
 * @param id mongoose id object
 * @returns {Promise<void>}
 */
async function getBirdByById(id) {
    return Bird.findById(id);
}

/**
 * Parses an HTTP POST request for creating or editing a bird into a birdJSON.
 *
 * Which is then to be inserted into a Mongo DB
 *
 * Ensures empty values or incorrect values are handled correctly
 *
 * @param body
 * @param filename
 * @return birdJSON as described
 */
function parseRequestToBird(body, filename) {
    // TODO add id field
    return {
        "primary_name": body.primaryName,
        "english_name": body.englishName,
        "scientific_name": body.sciName,
        "order": body.order,
        "family": body.family,
        "other_names": body.otherNames.split(EOL).map(s => s.trim()),
        "status": body.consStatus,
        "photo": {
            "credit": body.photoCredit,
            "source": filename
        },
        "size": {
            "length": {
                "value": isNaN(parseInt(body.length)) ? undefined : parseInt(body.length),
                "units": "cm"
            },
            "weight": {
                "value": isNaN(parseInt(body.weight)) ? undefined : parseInt(body.weight),
                "units": "g"
            }
        }
    }
}

/* route the default URL: `/birds/ */
router.get('/', async (req, res) => {
    // extract the query params
    const search = req.query.search;
    const status = req.query.status;
    const sort = req.query.sort;
    let birds = await getBirds()
    birds = controller.filter_bird_data(birds, search, status, sort);
    res.render("home", {birds: birds})
})

router.get("/view", async (req, res) => {
    let id = req.query.id
    let chosenBird = await getBirdByById(id)
    res.render("view_bird.pug", {
        bird: chosenBird, birdDisplay: "unique"
    })
})

router.get('/create', (req, res) => {
    // currently does nothing except redirect to home page
    res.render('create_edit_bird.pug', {
        title: "Creating a bird",
        editOrCreate: "create",
        otherNames: "",
        bird: {
            "primary_name": undefined,
            "english_name": undefined,
            "scientific_name": undefined,
            "order": undefined,
            "family": undefined,
            "other_names": undefined,
            "status": undefined,
            "photo": {
                "credit": undefined,
                "source": undefined
            },
            "size": {
                "length": {
                    "value": '',
                    "units": "cm"
                },
                "weight": {
                    "value": undefined,
                    "units": "g"
                }
            }
        },
        consStatuses: consStatuses
    })
});

router.post('/create', photoUpload.single("birdPhoto"), async (req, res) => {
    let filename = req.file === undefined ? undefined : req.file.filename
    let newBird = parseRequestToBird(req.body, filename)
    await Bird.create(newBird)
    if (req.file !== undefined) {
        moveBirdPhoto(req.file, req.body.photoName)
    }
    res.redirect("/birds/create")
});

/**
 * Moves an uploaded bird photo from its temporary location to its permanent location
 *
 * @param file a POST request file object as per the multer API
 * @param newFileName String for name of the new file, <b>JPG extension removed</b>
 */
function moveBirdPhoto(file, newFileName) {
    fs.rename(file.path, `public/images/${file.originalname}`, (err) => {
        if (err) throw err;
        console.log("File successfully moved!");
    })
}

router.get("/edit", async (req, res) => {
    let id = req.query.id
    const chosenBird = await getBirdByById(id)
    res.render("create_edit_bird.pug", {
        title: "Editing a bird",
        bird: chosenBird,
        editOrCreate: "edit",
        otherNames: chosenBird.other_names.join(EOL),
        consStatuses: consStatuses
    })
})

router.post("/edit", photoUpload.single("birdPhoto"), async (req, res) => {
    const id = req.query.id
    const chosenBird = await getBirdByById(id);
    let filename = req.file === undefined ? chosenBird.photo.source : req.file.filename
    const updatedBird = parseRequestToBird(req.body, filename)
    if (!lodash.isEqual(chosenBird, updatedBird)) { // Check if need to update
        await Bird.updateOne({_id:id}, updatedBird)
        console.log(updatedBird)
        getBirds().then(res => {console.log(res)})
    }
    if (req.file !== undefined) { // File may have not been changed
        moveBirdPhoto(req.file)
    }
    res.redirect("/")
})

router.get('/delete', async (req, res) => {
    const id = req.query.id
    const chosenBird = await getBirdByById(id)
    await Bird.deleteOne({_id: id}).then(() => {
        console.log("Bird successfully deleted")
    }).catch(e => {
        console.log(e)
    });
    res.redirect("/")
})

module.exports = router; // export the router