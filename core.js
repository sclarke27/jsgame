core = {
    init : function (win) {
        console.debug(win)
        Crafty.init(1024, 768);
        console.debug(Crafty.e("TiledLevel"))
        //Crafty.canvas.init();
        Crafty.e("TiledLevel").tiledLevel('map2.json')
        
    }
}


/*
var TileLevel = null;
Crafty.e(TileLevel).level(YOURLEVEL.json)
*/