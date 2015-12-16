
$.browser = {};




var Animate = require('./animate.js');

 window.b = new Animate({
    container:'.warp'
});

b.refreshQueue([{
    "id": "shape-TOvk_N32WoT6JdGC",
    "trigger": "click",
    "type": "flyIn",
    "sequence": 0,
    "state": "in",
    "speed": 1000,
    "perks": {
        "position": {},
        "direction": "bottom"
    },
    "group_position": 0
}, {
    "id": "shape-TOvk_N32WoT6JdGC",
    "trigger": "after",
    "type": "zoomIn",
    "sequence": 2,
    "state": "in",
    "speed": 100,
    "perks": {
        "position": {},
        "direction": ""
    },
    "group_position": 0
}, {
    "id": "shape-TOvk_N32WoT6JdGC",
    "trigger": "sametime",
    "type": "flyOut",
    "sequence": 1,
    "state": "out",
    "speed": 100,
    "perks": {
        "position": {},
        "direction": "bottom"
    },
    "group_position": 0
}, {
    "id": "shape-TOvk_N32WoT6JdGC",
    "trigger": "sametime",
    "type": "flyOut",
    "sequence": 1,
    "state": "out",
    "speed": 100,
    "perks": {
        "position": {},
        "direction": "bottom"
    },
    "group_position": 0
}]);

window.i = $('<input>').appendTo('body');
i.combobox({
    textField:'label',
    data: 
        [{
            label: '自顶部',
            value: '5%'
        }, {
            label: '自右侧',
            value: '62%'
        }, {
            label: '自底部',
            value: '6%'
        }, {
            label: '自左侧',
            value: '44%'
        }]
    ,
    onSelect:function function_name () {
        console.log('select')
    },
    onChange:function  () {
        console.log('change')
    }
})
// var a = [
//     {a:1,b:2},
//     {a:2,b:3},
//     {a:4,b:4},
//     {a:25,b:2},

// ]

// var c = [
//     {a:1,b:2},
//     {a:22,b:32},
//     {a:4,b:4},
//     {a:251,b:22},

// ];

// var d = _.filter(a,function(obj,i){
//     return _.isEqual(obj,c[i]);
// })
// console.log(d)
// d[0].a = 123123;
// console.log(a)
