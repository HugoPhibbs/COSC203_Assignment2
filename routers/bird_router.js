/* Creating Router */
const router = require('express').Router();
const controller = require("../controllers/bird_controller");
const lodash = require("lodash")

const Bird = require("../models/bird")

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
 * Parses an HTTP POST request body for creating or editing a bird into a birdJSON
 *
 * @param body
 * @return birdJSON as described
 */
function parseRequestToBird(body) {
    return {
        "primary_name": body.primaryName,
        "english_name": body.englishName,
        "scientific_name": body.sciName,
        "order": body.order,
        "family": body.family,
        "other_names": [body.order],
        "status": body.consStatus,
        "photo": {
            "credit": body.photoCredit,
            "source": 'ADD SOURCE' // TODO
        },
        "size": {
            "length": {
                "value": parseInt(body.length),
                "units": "cm"
            },
            "weight": {
                "value": parseInt(body.length),
                "units": "g"
            }
        }
    }
}

let birdsShown = undefined


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


// TODO: finish the "Create" route(s)
router.get('/create', (req, res) => {
    // currently does nothing except redirect to home page
    res.render('create_edit_bird.pug', {
        title: "Creating a bird",
        editOrCreate: "create",
        bird: {
            "primary_name": "",
            "english_name": "",
            "scientific_name": "",
            "order": "",
            "family": "",
            "other_names": [],
            "status": "",
            "photo": {
                "credit": "",
                "source": ""
            },
            "size": {
                "length": {
                    "value": '',
                    "units": ""
                },
                "weight": {
                    "value": '',
                    "units": ""
                }
            }
        }
    })
});

router.post('/create', async (req, res) => {
    // TODO handle splitting order into an array

    // TODO handle adding an image,
    const newBird = parseRequestToBird(req.body)

    await Bird.create(newBird);

    res.redirect("/birds/create")
});

router.get("/edit", async (req, res) => {

    let indexInt = parseInt(req.query.index)

    let birds = await getBirdsShown()

    res.render("create_edit_bird.pug", {
        title: "Editing a bird", bird: birds[indexInt], editOrCreate: "edit"
    })
})

router.post("/edit", async (req, res) => {
    const index = req.query.index
    const chosenBird = await getBirdAtIndex(index);
    const updatedBird = parseRequestToBird(req.body)

    if (!lodash.isEqual(chosenBird, updatedBird)) {
        await Bird.updateOne(chosenBird, updatedBird)
    }
    res.redirect("/")
})

router.get('/delete', async (req, res) => {
    const index = req.query.index
    const chosenBird = await getBirdAtIndex(index)
    await Bird.deleteOne(chosenBird);
    res.redirect("/")
})

// TODO: get individual bird route(s)

// TODO: Update bird route(s)

// TODO: Delete bird route(s)

module.exports = router; // export the router