let usernameNavbar = document.querySelector('.brand-logo');
const usernameInput = document.querySelector('#usernameInput'); 

// When DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // init username modal
    const usernameModal = document.querySelector('#usernameModal');
    const modalOptions = {
        onOpenEnd: () => {
            usernameInput.value = usernameNavbar.textContent;
            usernameInput.focus();
        }
    };
    
    const uModal = M.Modal.init(usernameModal, modalOptions);
    
    // if username not in localStorage
    if (!localStorage.getItem('username'))
        uModal.open();
    else
        usernameNavbar.innerHTML = localStorage.getItem('username');

    // set input keyup events
    document.querySelector('#usernameInput').onkeyup = changeUsername;
    // action when hit save btn in modal
    document.querySelector('#saveUsername').onclick = changeUsername;


    // init sidenav
    const sideNav = document.querySelector('.sidenav');
    const sideN = M.Sidenav.init(sideNav);


  });

  const changeUsername = (e) => {
      let source = e.originalTarget || e.srcElement ;
  
      if (e.key === 'Enter' || source.id === "saveUsername") {
          // target username input
          if (usernameInput.value.length > 0) {
              // change username on page
              usernameNavbar.innerHTML = usernameInput.value;
              // save username in localStorage
              localStorage.setItem('username', usernameInput.value);
              // clear input field
              usernameInput.value = '';
              // close modal
              M.Modal.getInstance(usernameModal).close();
  
          } else {
              alert('Provide an username')
          }
      }
  }

