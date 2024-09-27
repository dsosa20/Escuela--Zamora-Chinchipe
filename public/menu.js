(function() {
    const menu = document.querySelector('.menu__hamburguer'); 
    const list = document.querySelector('.nav__links'); 

    menu.addEventListener('click', () => {
        list.classList.toggle('nav__links--show'); 
    });
})();


