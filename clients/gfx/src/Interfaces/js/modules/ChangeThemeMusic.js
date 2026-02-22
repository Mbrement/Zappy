class ChangeThemeMusic {
    constructor() {
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Switch the visibility of the theme dropdown
     */
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

    /**
     * @author Corentin (ccharton) Charton
     * @description Switch the visibility of the music dropdown
     */
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

    /**
     * @author Corentin (ccharton) Charton
     * @description Close the theme dropdown
     */
    closeChangeTheme() {
        const changeThemeDropdown = document.getElementById('changeThemeDropdown')
        changeThemeDropdown.classList.add('changeButtonDropdownHidden')
        changeThemeDropdown.style.height = "0"
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Close the music dropdown
     */
    closeChangeMusic() {
        const changeMusicDropdown = document.getElementById('changeMusicDropdown')

        changeMusicDropdown.classList.add('changeButtonDropdownHidden')
        changeMusicDropdown.style.height = "0"
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Change the music based on the event target
     * @param event {Event} - The click event
     */
    changeMusic(event) {
        let spanText
        if (event.target.closest('span')) {
            spanText = event.target.closest('span').textContent.replaceAll(' ', '_')

        } else {
            for (const child of event.target.children) {
                if (child.tagName === 'SPAN') {
                    spanText = child.textContent.replaceAll(' ', '_')
                    break
                }
            }
        }
        window.mainInstance.musicManager.switchSoundtrack(spanText)
    }

    /**
     * @author Corentin (ccharton) Charton
     * @description Change the theme based on the event target
     * @param event {Event} - The click event
     */
    changeTheme(event) {
        let spanText
        if (event.target.closest('span')) {
            spanText = event.target.closest('span').textContent.replaceAll(' ', '_')
        } else {
            for (const child of event.target.children) {
                if (child.tagName === 'SPAN') {
                    spanText = child.textContent.replaceAll(' ', '_')
                    break
                }
            }
        }
        window.worldInstance.themeManager.switchSky(spanText)
    }
}

module.exports = ChangeThemeMusic;