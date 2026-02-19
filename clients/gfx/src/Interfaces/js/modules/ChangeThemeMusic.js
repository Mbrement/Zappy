class ChangeThemeMusic {
    constructor() {
    }

    switchChangeThemeVisibility() {
        const changeThemeDropdown = document.getElementById('changeThemeDropdown')
        if (changeThemeDropdown) {
            if (changeThemeDropdown.classList.contains('changeButtonDropdownHidden')) {
                this.closeChangeMusic()
                changeThemeDropdown.classList.remove('changeButtonDropdownHidden')
                changeThemeDropdown.style.height = "70px"
            }
            else {
                this.closeChangeTheme()
            }
        }
    }

    switchChangeMusicVisibility() {
        const changeMusicDropdown = document.getElementById('changeMusicDropdown')
        if (changeMusicDropdown) {
            if (changeMusicDropdown.classList.contains('changeButtonDropdownHidden')) {
                this.closeChangeTheme()
                changeMusicDropdown.classList.remove('changeButtonDropdownHidden')
                changeMusicDropdown.style.height = "135px"
            }
            else {
                this.closeChangeMusic()
            }
        }
    }

    closeChangeTheme() {
        const changeThemeDropdown = document.getElementById('changeThemeDropdown')
        changeThemeDropdown.classList.add('changeButtonDropdownHidden')
        changeThemeDropdown.style.height = "0"
    }

    closeChangeMusic() {
        const changeMusicDropdown = document.getElementById('changeMusicDropdown')

        changeMusicDropdown.classList.add('changeButtonDropdownHidden')
        changeMusicDropdown.style.height = "0"
    }

    changeMusic(event) {
        let spanText
        if (event.target.closest('span')) {
            spanText = event.target.closest('span').textContent.replaceAll(' ', '_')

            console.log('Using closet found:', spanText)
        } else {
            for (const child of event.target.children) {
                if (child.tagName === 'SPAN') {
                    spanText = child.textContent.replaceAll(' ', '_')
                    break
                }
            }
            console.log('Using children found:', spanText)
        }
        // TODO: add music change function call here
    }

    changeTheme(event) {
        let spanText
        if (event.target.closest('span')) {
            spanText = event.target.closest('span').textContent.replaceAll(' ', '_')

            console.log('Using closet found:', spanText)
        } else {
            for (const child of event.target.children) {
                if (child.tagName === 'SPAN') {
                    spanText = child.textContent.replaceAll(' ', '_')
                    break
                }
            }
            console.log('Using children found:', spanText)
        }
        // TODO: add theme change function call here
    }
}

module.exports = ChangeThemeMusic;