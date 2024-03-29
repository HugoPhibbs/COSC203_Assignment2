// string_normalize: strips diacritics and converts to lower case
function string_normalize(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// string_match: returns true if search_string is a substring of data_string
function string_match(property, search) {
    const d = string_normalize(property);
    const s = string_normalize(search);
    return d.includes(s)
}

// search_string: filters the birds which do contain `search` in any property
function search_string(birds, search) {
    return birds.filter(b => (
        string_match(b.primary_name, search)
        || string_match(b.english_name, search)
        || string_match(b.order, search)
        || string_match(b.family, search)
        || string_match(b.scientific_name, search)
        || b.other_names.some(o => string_match(o, search))
    ))
}

// compare_status: compares conservation status
function compare_status(a, b) {
    // map status to values to sort them
    const conservation_values = [
        { key: "Not Threatened", value: 0 },
        { key: "Naturally Uncommon", value: 1 },
        { key: "Relict", value: 2 },
        { key: "Recovering", value: 3 },
        { key: "Declining", value: 4 },
        { key: "Nationally Increasing", value: 5 },
        { key: "Nationally Vulnerable", value: 6 },
        { key: "Nationally Endangered", value: 7 },
        { key: "Nationally Critical", value: 8 },
        { key: "Data Deficient", value: 9 }
    ]
    const x = conservation_values.find(s => s.key == a).value;
    const y = conservation_values.find(s => s.key == b).value;
    return y - x;
}

// bird_sort: sorts the `birds` array using the keyword `sort`
function bird_sort(birds, sort) {
    var sort_func = () => 0; // default sort function always returns 0;
    // map sort "keys" to an appropriate seach function
    switch (sort) {
        case "Alphabetical":
            sort_func = (a, b) => a.primary_name.localeCompare(b.primary_name); break;
        case "Reverse alphabetical":
            sort_func = (a, b) => b.primary_name.localeCompare(a.primary_name); break;
        case "Shortest to longest":
            sort_func = (a, b) => a.size.length.value - b.size.length.value; break;
        case "Longest to shortest":
            sort_func = (a, b) => b.size.length.value - a.size.length.value; break;
        case "Lightest to heaviest":
            sort_func = (a, b) => a.size.weight.value - b.size.weight.value; break;
        case "Heaviest to lightest":
            sort_func = (a, b) => b.size.weight.value - a.size.weight.value; break;
        case "Endangered to unthreatened":
            sort_func = (a, b) => compare_status(a.status, b.status); break;
        case "Unthreatened to endangered":
            sort_func = (a, b) => compare_status(b.status, a.status); break;
    }
    return birds.sort(sort_func);
}

module.exports = { bird_sort, search_string}