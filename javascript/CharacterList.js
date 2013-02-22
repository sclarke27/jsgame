platformGame.gCharacterList = [];

platformGame.gCharacterList['brownBird'] = {
    name: "Brown Bird",
    width: 3,
    height: 3,
    isPlayable: true,
    sprite: {
        imgSrc: platformGame.kImgFolder + 'brownBird.png',
        width: 65,
        height: 65,
        offsetX: 0,
        offsetY: 0,
        frames: 5,
        duration: 400
    },
    keybindings: [
        [platformGame.kKeys.W, 'up' ],
        [platformGame.kKeys.S, 'down' ],
        [platformGame.kKeys.A, 'left' ],
        [platformGame.kKeys.D, 'right' ]
    ]
}

