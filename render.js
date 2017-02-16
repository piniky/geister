(function (global) {
    "use strict";
    // Class ------------------------------------------------
    function Render() { }

    // Header -----------------------------------------------
    global.Render = Render;
    global.Render.render = render;
    global.Render.RECT_BOARD = RECT_BOARD;
    global.Render.CELL_SIZE = CELL_SIZE;

    //-------------------------------------
    var COL = 6;
    var RECT_CANV = {
        x: 0,
        y: 0,
        w: 480,
        h: 480
    };
    var RECT_BOARD = {
        x: 0,
        y: 50,
        w: 480,
        h: 480
    };
    var CELL_SIZE = RECT_CANV.w / COL | 0;
    var COLOR_LINE = "#FFFFFF";
    var COLOR_WHITE = "#FFFFFF";
    var COLOR_BLACK = "#000000";
    var COLOR_SELECT = "#FFFFFF";

    var COLOR_PANEL_4 = "#006400 ";
    var COLOR_PANEL_5 = "#03a803 ";
    var COLOR_PANEL_6 = "#04cb04";

    var state_cache = null;
    var prev_revision = -1;
    var canv_cache = {
        canv_board: null,
        canv_pieaces: null,
        canv_effect: null,
        canv_text: null
    };

    function render(ctx, state, point, dragging, myturn) {
        if (prev_revision < 0) {
            canv_cache.canv_board = drawBoard(state);
            canv_cache.canv_pieaces = drawPieceALL(state, dragging, point, myturn);
            canv_cache.canv_effect = drawEffect(state);
            canv_cache.canv_text = drawText(state);
            Render.RECT_BOARD = RECT_BOARD;
            Render.CELL_SIZE = CELL_SIZE;
        } else {
            if (state.revision != prev_revision) {
                
                canv_cache.canv_text = drawText(state);
            }
            canv_cache.canv_pieaces = drawPieceALL(state, dragging, point, myturn);
            canv_cache.canv_effect = drawEffect(state, point);
        }

        ctx.clearRect(0, 0, RECT_CANV.w, RECT_CANV.h + 100);
        ctx.drawImage(canv_cache.canv_board, RECT_CANV.x, RECT_BOARD.y, RECT_CANV.w, RECT_CANV.h);
        ctx.drawImage(canv_cache.canv_pieaces, RECT_CANV.x, RECT_BOARD.y, RECT_CANV.w, RECT_CANV.h);
        ctx.drawImage(canv_cache.canv_effect, RECT_CANV.x, RECT_BOARD.y, RECT_CANV.w, RECT_CANV.h);
        ctx.drawImage(canv_cache.canv_text, 0, 0, RECT_CANV.w, RECT_CANV.h + 100);
        prev_revision = state.revision;
    }

    function drawBoard(state) {
        if (!canv_cache.canv_board) {
            canv_cache.canv_board = document.createElement("canvas");
            canv_cache.canv_board.width = RECT_CANV.w;
            canv_cache.canv_board.height = RECT_CANV.h;
        }
        var ctx = canv_cache.canv_board.getContext('2d');
        ctx.clearRect(RECT_CANV.x, RECT_CANV.y, RECT_CANV.w, RECT_CANV.h);

        var grad = ctx.createLinearGradient(RECT_CANV.x, RECT_CANV.y, RECT_CANV.w, RECT_CANV.h);
        grad.addColorStop(0, COLOR_PANEL_6);
        grad.addColorStop(0.3, COLOR_PANEL_5);
        grad.addColorStop(1, COLOR_PANEL_4);
        ctx.fillStyle = grad

        for (var x = 0; x < COL; x++) {
            for (var y = 0; y < COL; y++) {
                ctx.lineWidth = 1;
                ctx.strokeStyle = COLOR_LINE;
                ctx.beginPath();
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
        var canv_board2 = document.createElement("canvas");
        var ctx_board2 = canv_board2.getContext('2d');
        canv_board2.width = RECT_CANV.w;
        canv_board2.height = RECT_CANV.h;
        ctx_board2.clearRect(RECT_CANV.x, RECT_CANV.y, RECT_CANV.w, RECT_CANV.h);
        ctx_board2.globalAlpha = 0.07;
        ctx_board2.fillStyle = COLOR_WHITE;
        ctx_board2.beginPath();
        ctx_board2.arc(CELL_SIZE * 1, -3 * CELL_SIZE, 7 * CELL_SIZE, 0, Math.PI * 2, false);
        ctx_board2.fill();
        ctx.drawImage(canv_board2, RECT_CANV.x, RECT_CANV.y, RECT_CANV.w, RECT_CANV.h);


        return canv_cache.canv_board;
    }

    function drawPieceALL(state, dragging, point, myturn) {
        if (!canv_cache.canv_pieaces) {
            canv_cache.canv_pieaces = document.createElement("canvas");
            canv_cache.canv_pieaces.width = RECT_CANV.w;
            canv_cache.canv_pieaces.height = RECT_CANV.h;
        }
        var ctx = canv_cache.canv_pieaces.getContext('2d');
        ctx.clearRect(0, 0, RECT_CANV.w, RECT_CANV.h);

        for (var i = 0; i < COL * COL; i++) {
            if (state.map[i] == 0) continue;
            var x = i % COL, y = i / COL | 0;
            var isvisible = myturn == -1 || ((myturn == 0 && state.map[i] < 0) || (myturn == 1 && state.map[i] > 0));
            if (dragging.flag && i == dragging.value) {
                drawPiece(ctx, point.x - dragging.x + x * CELL_SIZE, point.y - dragging.y + y * CELL_SIZE, Math.abs(state.map[i]), isvisible);
            } else
                drawPiece(ctx, x * CELL_SIZE, y * CELL_SIZE, Math.abs(state.map[i]), isvisible);
        }

        return canv_cache.canv_pieaces;
    }

    function drawPiece(ctx, x, y, color, isvisible) {

        var grad = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
        var dot_color;
        var fill_color;
        
        fill_color = COLOR_WHITE;
        grad.addColorStop(0, 'rgb(180, 180, 180)');
        grad.addColorStop(0.4, fill_color);
        grad.addColorStop(1, fill_color);

        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(0, 0, 0, 1)";
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.fillRect(x + CELL_SIZE / 10 | 0, y + CELL_SIZE / 10 | 0, CELL_SIZE - 1 * CELL_SIZE / 5 | 0, CELL_SIZE - 1 * CELL_SIZE / 5 | 0);

        //init
        ctx.shadowColor = "rgba(0, 0, 0, 0)";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        //dot
        if (isvisible) {
            ctx.fillStyle = (color == 1 ? "#0000FF" : "#FF0000");
            ctx.beginPath();
            ctx.arc(x + CELL_SIZE / 2 , y + CELL_SIZE / 2 , 5, 0, Math.PI * 2, false);
            ctx.fill();
        }
        
        

        return ctx;
    }
    function drawEffect(state) {
        if (!canv_cache.canv_effect) {
            canv_cache.canv_effect = document.createElement("canvas");
            canv_cache.canv_effect.width = RECT_CANV.w;
            canv_cache.canv_effect.height = RECT_CANV.h;
        }
        var ctx = canv_cache.canv_effect.getContext('2d');
        var x, y, fillwidth, fillheight;

        ctx.clearRect(0, 0, RECT_CANV.w, RECT_CANV.h);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = COLOR_SELECT;
        ctx.lineWidth = 1;
        ctx.beginPath();

        if (state.selected.name == "RECT_BOARD") {
            x = (state.selected.value % COL | 0) * CELL_SIZE;
            y = (state.selected.value / COL | 0) * CELL_SIZE;
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }

        return canv_cache.canv_effect;
    }

    function drawText(state) {
        if (!canv_cache.canv_text) {
            canv_cache.canv_text = document.createElement("canvas");
            canv_cache.canv_text.width = RECT_CANV.w;
            canv_cache.canv_text.height = RECT_CANV.h + 100;
        }
        var ctx = canv_cache.canv_text.getContext('2d');
        var x, y;

        ctx.globalAlpha = 1;
        ctx.fillStyle = "#000000";
        ctx.clearRect(0, 0, RECT_CANV.w, RECT_CANV.h + 100);
        ctx.font = "24px Century Gothic";
        ctx.textAlign = 'center';

        ctx.fillText('先手　' + state.playersName[0], 100, 30, 300);
        ctx.fillText('後手　' + state.playersName[1], 100, 570, 300);

        ctx.fillText('青 : ' + state.rest[0][0] + " 赤 : " + state.rest[0][1], 400, 30, 250);
        ctx.fillText('青 : ' + state.rest[1][0] + " 赤 : " + state.rest[1][1], 400, 570, 250);

        //turn
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#FF0000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.fillRect(0, (state.turn == 0 ? 10 : 550), 500, 30);

        return canv_cache.canv_text;
    }

    function objCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }


})((this || 0).self || global);