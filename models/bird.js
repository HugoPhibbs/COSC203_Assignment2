const mongoose = require("mongoose")

const birdSchema = new mongoose.Schema({
        primary_name: String,
        english_name: String,
        scientific_name: String,
        order: String,
        family: String,
        other_names: [String],
        status: String,
        photo:{
                credit: {type: String},
                source: {type: String}
        },
        size: {
            type: {
                length: {
                    type: {
                        value: Number,
                        units: String
                    }
                },
                weight: {
                    type: {
                        value: Number,
                        units: String
                    }
                }
            }
        }
    }
)

const Bird = mongoose.model("Bird", birdSchema)

module.exports = Bird;