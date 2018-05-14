// When DOM loaded
document.addEventListener('DOMContentLoaded', function() {

    // init username modal
    const usernameModal = document.querySelector('#usernameModal');
    const modalOptions = {
        onOpenEnd: () => document.querySelector('#usernameInput').focus()
    };
    
    const uModal = M.Modal.init(usernameModal, modalOptions);
    
    // if username not in localStorage
    // if (localstorage....)
    uModal.open();

    // set input keyup events
    document.querySelector('#usernameInput').onkeyup = changeUsername;
    // action when hit save btn in modal
    document.querySelector('#saveUsername').onclick = changeUsername;

  });


const changeUsername = (e) => {
    let source = e.originalTarget || e.srcElement ;

    if (e.key === 'Enter' || source.id === "saveUsername") {
        // target username input
        const username = document.querySelector('#usernameInput');

        if (username.value.length > 0) {
            document.querySelector('.brand-logo').innerHTML = username.value;
            // clear input field
            username.value = '';
            // close modal
            M.Modal.getInstance(usernameModal).close();

        } else {
            alert('Provide an username')
        }
    }
}
