(function (global) {
    "use strict";
    // Class ------------------------------------------------
    function Game() { }

    // Header -----------------------------------------------
    global.Game = Game;
    global.Game.initGame = initGame;

    // ------------------------------------------------------
    var COL = 6;
    var myInfo = { name: "名無し", turn: 0 };
    var playersInfo = [];
    var ctx;
    var evented = false;
    var state = {}
    var dragging = { flag: false, x: 0, y: 0, value: -1 };
    var point = {
        x: 0,
        y: 0,
        state: ""
    }
    var init_state = {
        room: "1111",
        action: "move",
        map: [0, -1, -1, -2, -2, 0,
            0, -2, -2, -1, -1, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 1, 1, 2, 2, 0,
            0, 2, 2, 1, 1, 0
        ],
        mode: 0,
        turn: 0,
        revision: 0,
        selected: {
            name: "",
            value: 0
        },
        rest: [[4, 4], [4, 4]],
        playersName: ["", ""]
    };

    function initGame(_ctx, roomnum) {
        myInfo["name"] = $("#playerName").val();

        var pusher = new Pusher('APP_KEY', {
            cluster: 'ap1',
            encrypted: true
        });

        if (roomnum == "") {
            roomnum = Math.floor(Math.random() * 9000) + 1000;
            appendLog("部屋番号" + roomnum + "を作成しようとしています。");

        } else {
            appendLog("部屋" + roomnum + "に入室しようとしています。");
        }
        var channel = pusher.subscribe("geister-" + roomnum);
        console.log("joined " + roomnum);
        //send join
        sendPush("join", { "name": myInfo["name"], room: roomnum });


        channel.bind('move', function (data) {
            state = JSON.parse(data);
            Render.render(ctx, state, point, dragging, myInfo.turn);
            var ret = isEnd(state);
            if (ret != -1) {
                alert(state.playersName[ret] + "さんの勝ちです。");
                appendLog(state.playersName[ret] + "さんの勝ちです。");
                state.mode = 0;
            }
        });
        channel.bind('modify', function (data) {
            obj = JSON.parse(data);
            state = JSON.parse(obj.state);
            Render.render(ctx, state, point, dragging, myInfo.turn);
            appendLog("盤面を修正しました。" + state.playersName[state.turn] + "さんのターンです。");
        });


        channel.bind('join', function (data) {
            var obj = JSON.parse(data);
            if (obj["name"] == myInfo.name) return;
            console.log("hooked join");

            if (state.mode != 1) {
                sendPush("joinres", { room: roomnum, result: "NG" });
                appendLog(obj["name"] + "さんが見学モードで入室しました。");
            } else {
                //先後決め
                var d = new Date();

                if (d.getTime() % 2 == 0) {
                    myInfo.turn = 0;
                    state.playersName[1] = obj["name"];
                    state.playersName[0] = myInfo["name"];
                } else {
                    myInfo.turn = 1;
                    state.playersName[0] = obj["name"];
                    state.playersName[1] = myInfo["name"];
                }
                sendPush("joinres", { room: roomnum, result: "OK", name: myInfo.name, turn: (myInfo.turn == 1 ? 0 : 1) });
                appendLog(obj["name"] + "さんが入室しました。ゲームを開始します。");

                state.mode = 2;
                appendLog("自陣の初期配置を変更してください。(ドラッグで入れ替え、終わったら空きマスをクリック)");
                Render.render(ctx, state, point, dragging, myInfo.turn);
            }
        });

        channel.bind('joinres', function (data) {
            console.log(state.mode);
            var obj = JSON.parse(data);
            if (obj.name == myInfo.name) return;
            if (state.mode != 1) return;

            if (obj["result"] == "OK") {
                state.turn = 0;
                myInfo.turn = obj.turn;
                if (obj.turn == 0) {
                    state.playersName[0] = myInfo["name"];
                    state.playersName[1] = obj["name"];
                } else {
                    state.playersName[0] = obj["name"];
                    state.playersName[1] = myInfo["name"];
                }
                appendLog("部屋" + roomnum + "に入室成功しました。相手プレーヤーは" + obj["name"] + "さんです。");
                appendLog("自陣の初期配置を変更してください。(ドラッグで入れ替え、終わったら空きマスをクリック)");
                state.mode = 2;
                Render.render(ctx, state, point, dragging, myInfo.turn);
            } else {
                appendLog("部屋" + roomnum + "は既に満員だったので、見学モードで入室しました。");
                state.mode = 0;
                myInfo.turn = -1;
            }
        });
        channel.bind('init', function (data) {
            var obj = JSON.parse(data);
            if (obj.name == myInfo.name) return;

            if (myInfo.turn == 0) {
                for (var i = 0; i < 4; i++) {
                    state.map[i + 25] = obj.map1[i];
                    state.map[i + 31] = obj.map2[i];
                }
            } else {
                for (var i = 0; i < 4; i++) {
                    state.map[i + 1] = obj.map1[i];
                    state.map[i + 7] = obj.map2[i];
                }
            }
            appendLog(state.playersName[(myInfo.turn == 1 ? 0 : 1)] + "さんの配置が完了しました。");
            if (state.mode == 4) {
                state.mode = 5;
                appendLog("ゲーム開始です。先攻：" + state.playersName[0] + "さん");
            } else if (state.mode == 2) {
                state.mode = 3;
            }
        });

        ctx = _ctx;
        state = objCopy(init_state);
        state.room = roomnum;
        state.mode = 1;
        if (!evented) {
            evented = true;
            setEvents();
        }
        Render.render(ctx, state, point, dragging, myInfo.turn);
    }
    function setEvents() {
        var isTouch;
        if ('ontouchstart' in window) {
            isTouch = true;
        } else {
            isTouch = false;
        }
        if (isTouch) {
            ctx.canvas.addEventListener('touchstart', ev_mouseDown);
        } else {
            ctx.canvas.addEventListener('mousemove', ev_mouseMove);
            ctx.canvas.addEventListener('mousedown', ev_mouseDown);
            ctx.canvas.addEventListener('mouseup', ev_mouseUp);
        }
    }

    function ev_mouseMove(e) {
        getMousePosition(e);
        state.selected = hitTest(point.x, point.y);
        if (state.selected.name == "NONE") {
            dragging.flag = false;
        }
        Render.render(ctx, state, point, dragging, myInfo.turn);
    }
    function ev_mouseUp(e) {
        if (!dragging.flag) return;
        state.selected = hitTest(point.x, point.y);
        dragging.flag = false;

        if (state.selected.name == "RECT_BOARD") {
            var x1 = dragging.x / Render.CELL_SIZE | 0, y1 = (dragging.y - Render.RECT_BOARD.y) / Render.CELL_SIZE | 0;
            var x2 = (point.x / Render.CELL_SIZE) | 0, y2 = (point.y - Render.RECT_BOARD.y) / Render.CELL_SIZE | 0;
            if (state.mode == 2 || state.mode == 3) {
                if (state.map[y1 * COL + x1] * state.map[y2 * COL + x2] > 0) {
                    var tmp = state.map[y1 * COL + x1];
                    state.map[y1 * COL + x1] = state.map[y2 * COL + x2];
                    state.map[y2 * COL + x2] = tmp;
                }

            } else if (state.mode == 5) {
                var movable = canMove(state.map, dragging.value % COL | 0, dragging.value / COL | 0, x2, y2);
                if (movable) {
                    if (state.map[y2 * COL + x2] != 0) {
                        console.log(state.map[y2 * COL + x2]);
                        state.rest[state.turn == 1 ? 0 : 1][Math.abs(state.map[y2 * COL + x2]) - 1] -= 1;
                    }
                    state.map[y2 * COL + x2] = state.map[y1 * COL + x1];
                    state.map[y1 * COL + x1] = 0;
                    state.turn = (state.turn == 1 ? 0 : 1);
                    state.revision += 1;
                    sendPush("move", state);

                }

            }
        }
        Render.render(ctx, state, point, dragging, myInfo.turn);
    }

    function ev_mouseDown(e) {
        var selected = hitTest(point.x, point.y);

        if (state.mode == 2 || state.mode == 3) {
            if (selected.name == "RECT_BOARD" && state.map[selected.value] == 0) {
                var map1, map2;
                if (myInfo.turn == 0) {
                    map1 = state.map.slice(1, 5);
                    map2 = state.map.slice(7, 11);
                } else {
                    map1 = state.map.slice(25, 29);
                    map2 = state.map.slice(31, 35);
                }
                sendPush("init", { room: state.room, map1: map1, map2: map2, name: myInfo.name });
                appendLog("配置を送信しました。これ以降の変更はできません。");
                if (state.mode == 3) {
                    state.mode = 5;
                    appendLog("ゲーム開始です。先攻：" + state.playersName[0] + "さん");
                } else {
                    state.mode = 4;
                }
            } else if (selected.name === "RECT_BOARD" && state.map[selected.value] * (myInfo.turn == 1 ? 1 : -1) > 0) {
                dragging.flag = true;
                dragging.value = selected.value;
                dragging.x = point.x; dragging.y = point.y;

            }
        } else if (state.mode == 5) {
            if (state.playersName[state.turn == 1 ? 1 : 0] != myInfo.name) return;
            if (selected.name === "RECT_BOARD" && state.map[selected.value] * (state.turn == 1 ? 1 : -1) > 0) {
                dragging.flag = true;
                dragging.value = selected.value;
                dragging.x = point.x; dragging.y = point.y;

            }
        }

    }

    function sendPush(action, obj) {
        var url = "push.php";
        obj.action = action;
        var JSONdata = obj;
        console.log("sendPush : " + action + " : " + JSON.stringify(JSONdata));
        $.ajax({
            type: 'post',
            url: url,
            data: JSON.stringify(JSONdata),
            contentType: 'application/JSON',
            dataType: 'JSON',
            scriptCharset: 'utf-8',
            success: function (data) {
                //appendLog("送信しました");
            },
            error: function () {
                //appendLog("送信に失敗しました");
            }
        });
    }


    function appendLog(str) {
        $("#log").append(str + '\n');
        $("#log").scrollTop($("#log")[0].scrollHeight);
    }

    function getMousePosition(e) {
        if (!e.clientX) { //SmartPhone
            if (e.touches) {
                e = e.originalEvent.touches[0];
            } else if (e.originalEvent.touches) {
                e = e.originalEvent.touches[0];
            } else {
                e = event.touches[0];
            }
        }
        var rect = e.target.getBoundingClientRect();
        point.x = e.clientX - rect.left;
        point.y = e.clientY - rect.top;
    }

    function hitTest(x, y) {
        var objects = [Render.RECT_BOARD];
        var click_obj = null;
        var selected = {
            name: "",
            value: 0
        }
        if (Render.RECT_BOARD.w >= x && Render.RECT_BOARD.x <= x && (Render.RECT_BOARD.h + Render.RECT_BOARD.y) >= y && Render.RECT_BOARD.y <= y) {
            selected.name = "RECT_BOARD";
            selected.value = Math.floor((y - Render.RECT_BOARD.y) / Render.CELL_SIZE) * COL + Math.floor(x / Render.CELL_SIZE);
        } else {
            selected.name = "NONE";
            selected.value = -1;
        }
        return selected;
    }

    function objCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    function isEnd(state) {
        if (state.rest[0][0] == 0 || state.rest[1][1] == 0) return 1;
        else if (state.rest[1][0] == 0 || state.rest[0][1] == 0) return 0;

        if ((state.map[0] == 1 || state.map[5] == 1) && state.turn == 1) return 1;
        else if ((state.map[30] == -1 || state.map[35] == -1) && state.turn == 0) return 0;

        return -1;
    }
    
    function canMove(map, x1, y1, x2, y2) {
        if (map[y1 * COL + x1] * map[y2 * COL + x2] > 0) return false;
        return ((x1 == x2 && y1 != y2 && Math.abs(y1 - y2) == 1) || (x1 != x2 && y1 == y2 && Math.abs(x1 - x2) == 1));
    }

})((this || 0).self || global);