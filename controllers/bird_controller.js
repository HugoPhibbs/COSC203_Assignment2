const { bird_sort, search_string } = require('./bird_utils.js');

/**
 * Filters entered BirdJSON data
 *
 * I've decided to do filtering post getting JSON data from DB, saves me from writing extra mongoose code
 *
 * @param birdJSON
 * @param search
 * @param status
 * @param sort
 * @returns Inputted BirdJSON data filtered
 */
function filter_bird_data(birdJSON, search, status, sort) {
    
    // filter by conservation status
    if (status !== undefined && status !== "All") {
        birdJSON = birdJSON.filter((b) => b.status == status);
    }
    // filter by search string
    if (search !== undefined && search !== "") {
        birdJSON = search_string(birdJSON, search);
    }
    // sort by
    if (sort !== undefined) {
        birdJSON = bird_sort(birdJSON, sort);
    }
    
    return birdJSON;
}

module.exports = { filter_bird_data };