/* Creating Router */
const router = require('express').Router();
const controller = require("../controllers/bird_controller");
const lodash = require("lodash")
const Bird = require("../models/bird")
const fs = require("node:fs");
const EOL = require("node:os").EOL

// Birds that are currently shown to a user, don't judge me for using pretty much global variables
let birdsShown = undefined

/* Setting up multer*/
const multer = require("multer")
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
 * Gets the birds that are currently shown on a page
 *
 * If none are shown, then it just finds all birds.
 *
 * This is done to implement selecting a bird, this is done via index.
 *
 * Makes sure that accessing birds/view?index=... doesn't break the site!
 *
 * Solution may be a bit flimsy, but it works.
 *
 * @returns {Promise<Query<Array<HydratedDocument<unknown, {}, {}>>, Document<unknown, any, unknown> & unknown extends {_id?: infer U} ? IfAny<U, {_id: Types.ObjectId}, Required<{_id: U}>> : {_id: Types.ObjectId}, {}, unknown>|undefined>}
 */
async function getBirdsShown() {
    if (birdsShown === undefined) {
        return getBirds()
    }
    return birdsShown
}

/**
 * Gets a bird from the birds currently shown at a given index
 *
 * @param index
 * @returns {Promise<*>}
 */
async function getBirdAtIndex(index) {
    const birdsShown = await getBirdsShown()
    return birdsShown[index]
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
    return {
        "primary_name": body.primaryName,
        "english_name": body.englishName,
        "scientific_name": body.sciName,
        "order": body.order,
        "family": body.family,
        "other_names": body.otherNames.split(EOL).map(s=>s.trim()),
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
    birdsShown = await getBirds()
    birdsShown = controller.filter_bird_data(birdsShown, search, status, sort);
    res.render("home", {birds: birdsShown})
})


router.get("/view", async (req, res) => {
    let index = req.query.index
    let chosenBird = await getBirdAtIndex(index)
    res.render("view_bird.pug", {
        bird: chosenBird, birdDisplay: "unique", index: index
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
        }
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
    let birdIndex = parseInt(req.query.index)
    let birds = await getBirdsShown()
    const chosenBird = birds[birdIndex]
    res.render("create_edit_bird.pug", {
        title: "Editing a bird", bird: chosenBird, editOrCreate: "edit", otherNames:chosenBird.other_names.join(EOL), index:birdIndex
    })
})

router.post("/edit", photoUpload.single("birdPhoto"), async (req, res) => {
    const index = req.query.index
    const chosenBird = await getBirdAtIndex(index);
    let filename = req.file === undefined ? chosenBird.photo.source : req.file.filename
    const updatedBird = parseRequestToBird(req.body, filename)
    if (!lodash.isEqual(chosenBird, updatedBird)) { // Check if need to update
        await Bird.updateOne(chosenBird, updatedBird)
    }
    if (req.file !== undefined) { // File may have not been changed
        moveBirdPhoto(req.file)
    }
    res.redirect("/")
})

router.get('/delete', async (req, res) => {
    const index = req.query.index
    const chosenBird = await getBirdAtIndex(index)
    await Bird.deleteOne({_id:chosenBird._id}).then(() => {
        console.log("Bird successfully deleted")
    }).catch(e => {
        console.log(e)
    });
    res.redirect("/")
})

module.exports = router; // export the router