/**
 * Function to handle previewing of a photo once it has been uploaded
 *
 * Credit to https://cosc203asgn2.herokuapp.com/birds/63187f1405c6b049fa63dd36/edit
 */
document.getElementById("bird-photo").onchange = function() { // FIXME why not ()=>{}??
    let file = this.files[0]
    document.getElementById("photo-preview").src = URL.createObjectURL(file);
    let photoName = document.getElementById('photo-name')
    photoName.value = file.name.split('.')[0] // Remove extensions
    photoName.required = true
}