var temp = require('./1.html');
var itemTemp = _.template(require('./item.html'));


/**
 * 动画面板管理类的构造函数. 构建面板UI. 绑定相关动作处理器.
 * @memberof cwwriter.animation.AnimatePanel
 * @param {Object} [opt] 其格式为:
 * <pre>
 * {
 *   container: dom, // 面板所处容器的dom
 * }
 * </pre>
 */
function AnimatePanel(opts) {
    // console.log('ctn', opt.container);
    var $container = $(opts.container);
    $container.html(temp);

    this.$queuebox = $container.find('.animate-queue-list');
    this.$queuebox.css('height', '245');
    this.$addBtn = $container.find('.animate-button.add-animate');
    this.$delBtn = $container.find('.animate-button.delete-animate');
    this.$startSel = $container.find('.animate-start-select');
    this.$attrSel = $container.find('.animate-attr-select');
    this.$speedSel = $container.find('.animate-speed-select');
    this.$effectMenu = $container.find('.add-animate-div');
    this.$container = $container;
    /**
     * 面板维护的动画队列数据,所有的数据操作均对此变量操作
     * 此数据更改后会渲染UI
     * @type {Array}
     */
    this.queue = [];

    /**
     * 所选择的数据在this.queue中的索引
     * @type {Array}
     */
    this.selectedItems = [];
   
    this.bindEvent();
    
    this.setDelBtnEnabled(false);
    this.setAllSelEnabled(false);
}

AnimatePanel.prototype =
    /** @lends cwwriter.animation.AnimatePanel */
    {
        /**
         * 将动画队列清空.
         */
        clearQueue: function() {
            this.queue = [];
            this.selectedItems = [];
            this.renderByItems(true);
        },

        /**
         * 刷新动画队列. 清理原有动画队列数据. 在队列中显示新的动画队列数据.
         * @param {Array} [q] 动画队列
         */
        refreshQueue: function(q) {
            

            this.queue = q;
            this.selectedItems = [];
            this.renderByItems(true);
        },

        /**
         * 选择队列中的动画项目.
         * @param {Array|Object} sel
         */
        selectAnimation: function(sel) {
            var items = 'Object' == root.getVarType(sel) ? [sel] : sel;

            console.log('select items', items);
        },


    };



//***********选择相关*********************//

_.extend(AnimatePanel.prototype, {
    /**
     * 选择一项,会先清除其他已选项
     *
     */
    selectUniqueItem: function(index) {

        this.selectedItems = [index];
        this.renderAfterSelectedChange();
    },

    /**
     * 添加选择项，已选项不会被清除
     */
    selectAddItems: function(index) {
      
        this.selectedItems = this.selectedItems.concat(index); 
        this.renderAfterSelectedChange(); 
    },

    /**
     * 取消一个已选项
     * 
     */
    unselectItem: function(index) {
        this.selectedItems = _.reject(this.selectedItems,function(n){
            return index === n;
        });
        this.renderAfterSelectedChange();
    },

    /**
     * 取消一系列已选项
     * @param  {Array} [indexes] 例如[1,2,3]
     */
    unselectItems: function(indexes) {
        this.selectedItems = _.reject(this.selectedItems, function(n){
            return indexes.indexOf(n) > -1;
        });
        this.renderAfterSelectedChange();
    },

    /**
     * 当选择项发生变化时候更新ui
     * 相关ui有:
     * 高亮选择项
     * 3个下拉框的启用情况
     * 添加按钮与删除按钮的启用情况
     * @param {Boolen} [isModified] 已选项是否更改 ，undifined 视为 true
     */
    renderAfterSelectedChange: function(isModified) {
     
        var that = this;
        var animationDomItems = that.$queuebox.find('.animate-queue-list-item');
        var total = this.selectedItems.length;
        //修正高亮
        animationDomItems.removeClass('animate-queue-list-item-selected');
        this.selectedItems.forEach(function(index){
            animationDomItems.eq(index).addClass('animate-queue-list-item-selected');
        });

        //已选项没有发生变化时，不需要对下拉框 按钮进行更改
        if(isModified === false) return false;

        //添加按钮
        this.setAddBtnType(total == 0 ? 'add':'change');
        this.setAddBtnEnabled(true);

        //删除按钮
        this.setDelBtnEnabled(total !== 0);

        //下拉框设置
        this.setAllSelEnabled(this.selectedItems.length !== 0);
        if(this.selectedItems.length !== 0){
            var sameValues = this.getSameValueFromItems(this.getSetectedItems(true));

            //start下拉框
            if(sameValues.trigger){
                this.$startSel.combobox('select',sameValues.trigger);
            }else{
                this.$startSel.combobox('setText','');
                setSelEnabled(this.$startSel,false);
            };

            //attr下拉框
            if(sameValues.type && sameValues.perks){
                this.attrSelReload(sameValues.type,sameValues.perks);
            }else{
                this.$attrSel.combobox('setText','');
                setSelEnabled(this.$attrSel,false);
            };

            //speed下拉框
            if(sameValues.speed){
                this.$speedSel.combobox('select',sameValues.speed);
            }else{
                this.$speedSel.combobox('setText','');
                setSelEnabled(this.$speedSel,false);
            }
        } 
    }

});

//***********选择 end*********************//



//******************添加，修改，删除*********//

_.extend(AnimatePanel.prototype, {

    /**
     * 添加动画项
     */
    addItem: function(animationData) {
        this.queue.push(animationData);
        this.renderByItems();
        //选择最后一项
        this.selectUniqueItem(this.queue.length - 1);
    },

    /**
     * 删除多个动画项
     */
    deleteItems: function(indexes) {
        var remaining = _.map(this.queue,function(item,i){
            if(indexes.indexOf(i) > -1){
                return false;
            }else{
                return item;
            }
        });
        this.queue = _.compact(remaining);
        this.renderByItems();
        
        //清空已选择
        this.unselectItems(indexes);
        

    },

    /**
     * 更改多个动画项
     */
    changeItems: function(indexes,data) {

        indexes.forEach(function  (index) {
            $.extend(true,this.queue[index],data);
        }.bind(this));

        this.renderByItems();
        if(data.type && data.state){
            this.renderAfterSelectedChange(true);
        }
    },

    /**
     * 渲染
     */
    renderByItems: function(){
        this.correctSequenceAndGroup();

        var tempData = this.queue2tempData();
        var str = '';
        tempData.forEach(function(data) {
            str += itemTemp(data);
        }.bind(this))
        this.$queuebox.html(str);
        this.renderAfterSelectedChange(false);
    }
});

//*****************添加，修改，删除 end *****//



//***************数据处理相关*****************//

_.extend(AnimatePanel.prototype, {

    /**
     * 暂不需要
     * 将列表项dom转为json对象
     * @param  {jq} $ele 动画项
     * @return {Array}   [{},{}]
     */
    items2Data: function($ele) {
        // body...
    },

    /**
     * 将队列数据转换为template所需要数据
     * @return {JSON} 
     */
    queue2tempData: function() {
        var firstIsSame = this.queue[0] ? this.queue[0].trigger === 'sametime' : false;
        var firstIsClick = this.queue[0] ? this.queue[0].trigger === 'click' : false;
        var serial = 0;
        return _.map(this.queue, function(data, i) {
            var d = $.extend(true,{},data);

            //将英文转为汉字 eg: 'flyin' =》 '飞入'
            _.forEach(d, function(value, key) {
                if (dictionary[value]) {
                    d[key] = dictionary[value];
                }
            });

            //默认显示序号
            d.showSerial = true;
            
            if(data['trigger'] !== 'click' && i != 0){
                d.showSerial = false;
            }

            //
            if(data['trigger'] == 'click'){
                serial++;
            }
            d.serial = serial;

            //默认显示图片
            d.hasImg = true; 
            //如果触发方式为'sametime' 隐藏图片 
            if (data['trigger'] == 'sametime') {
                d.hasImg = false;
            } 

            //图片地址
            d.triggerImg = dictionary['triggerImg'][data['trigger']];
            // 将原始数据保存在dom的data-animation上
            var json = JSON.stringify(data);
            d.jsonstr = json;

            return d;
        })
    },

    /**
     * 矫正对动画队列的sequence 与 group_position。
     * 每次添加、删除、排序、开始方式变化都需调用此方法。
     */
    correctSequenceAndGroup: function() {
        var lastSeq = -1;
        var lastGroup = 0;
        this.queue.forEach(function(data, i) {
            var trigger = data.trigger;
            if (trigger == 'click') {
                data.sequence = lastSeq + 1;
                data.group_position = 0;
            } else if (trigger == 'sametime') {
                if (i == 0) {
                    //如果第一个是通过‘之前’触发
                    data.sequence = 0;
                    data.group_position = 0;

                } else {
                    data.sequence = lastSeq;
                    data.group_position = lastGroup + 1;
                }

            } else if (trigger == 'after') {
                data.sequence = lastSeq + 1;
                data.group_position = 0;
            };

            lastSeq = data.sequence;
            lastGroup = data.group_position;

        })
    },

    /**
     * 获取已选择的动画项数据
     * param {Boolen} 是否克隆原始数据
     * @return {Array} 
     */
    getSetectedItems: function(isClone) {
        var that = this;
        return _.map(this.selectedItems,function(index) {
            if(isClone){
                return $.extend(true,{},that.queue[index]);
            }else{
                return that.queue[index];
            }
        });
    },

    /**
     * 提取数据中相同的值
     * @param  {Array} [items] 动画数据列表
     * @param {Array} [props]  需要提取的属性名列表
     * @return {JSON}  如果某个属性名的值都相同则为该值，否则为false;
     */
    getSameValueFromItems: function  (items,props) {
        //默认需要提取的属性名
        props = props ? props : ['trigger','type','perks','speed'];
        var ret = _.pick(items[0],props);
        _.reduce(items,function  (ret,next) {
            props.forEach(function  (prop) {
                //100 与 '100' 也视为相同
                if(!_.isEqual(ret[prop],next[prop]) && ret[prop] != next[prop] ){
                    ret[prop] = false;
                }
            });
            return ret;
        },ret);
       
        return ret;

    }



})

//****************数据处理相关 end************//



//****************事件相关****************//

_.extend(AnimatePanel.prototype,{

    /**
     * 绑定事件
     */
    bindEvent:function  () {
            
        this.menuEvent();
        this.addBtnEvent();
        this.delBtnEvent();
        this.animationDomItemsEvent();

        this.startSelEvent();
        this.attrSelEvent();
        this.speedSelEvent();
    },

    /**
     * 菜单事件
     */
    menuEvent:function  () {
        var that = this;
        this.$effectMenu.menu({
            onClick:function(e){
                var item = $(e.target);
                var animationType = item.attr('type');
                var selectDom = getSelectDom();
                var animationData = animationConfig['_'+animationType](selectDom);
                var type = that.$addBtn.attr('type');
                if(type == 'add'){
                    that.addItem(animationData);
                }else if(type == 'change'){
                    that.changeItems(that.selectedItems,_.pick(animationData,['type','state','perks']));
                }
               
            }
        })
    },

    /**
     * 添加按钮事件
     */
    addBtnEvent:function  () {
        this.$addBtn.click(function(e) {
            var target = $(e.target);
            var offset = target.offset();
            this.$effectMenu.menu('show',{
                left:offset.left,
                top:offset.top + target.height()+10
            })
        }.bind(this));
    },

    /**
     * 动画列表项的事件
     */
    animationDomItemsEvent:function  () {
        var that = this;
        //选择选项
        $('.animate-queue-list-item',this.$queuebox).live('click',function  (e) {
            var index = $('.animate-queue-list-item',this.$queuebox).index(this);
            if(that.selectedItems.indexOf(index)>-1){
                that.unselectItem(index);
            }else{
                if (e.ctrlKey) {
                    that.selectAddItems(index);
                } else {
                    that.selectUniqueItem(index);
                }
            }
        });
        //清空选项
        this.$queuebox.click(function(e) {
            var target = $(e.target);
            if(target.hasClass('animate-queue-list-item') || target.parents('.animate-queue-list-item').length>0){
                return true;
            }
            that.unselectItems(_.clone(that.selectedItems));
           
        });
        
    },

    delBtnEvent:function  () {
        var that = this;
        this.$delBtn.click(function(event) {
            that.deleteItems(_.clone(that.selectedItems));
        });
    },

    startSelEvent: function  () {
        var that = this;
        var newData = {
            trigger:''
        };
        this.$startSel.combobox({
            editable:false,
            onChange:function(newv,oldv){
                newData.trigger = newv;
                that.changeItems(that.selectedItems,newData);

            }
        });
        this.$startSel.next('.combo').find('.combo-text').click(function(){
           that.$startSel.combobox('showPanel'); 
        });
    },

    attrSelEvent: function  () {
        var that = this;
        var newData = {
            perks:{

            }
        };
        var type = this.queue[this.selectedItems[0]];
        this.$attrSel.combobox({
            editable:false,
            textField:'label',
            onChange:function(newv,oldv){
                
                newData.perks[type == ''] = newv;
                that.changeItems(that.selectedItems,newData);
            }

        });
        this.$attrSel.next('.combo').find('.combo-text').click(function(){
           that.$attrSel.combobox('showPanel'); 
        });
    },

    speedSelEvent: function  () {
        var that = this;
        var newData = {
            speed:''
        };
        this.$speedSel.combobox({
            editable:false,
            onChange:function(newv,oldv){
                newData.speed = newv;
                that.changeItems(that.selectedItems,newData);
            }

        });
        this.$speedSel.next('.combo').find('.combo-text').click(function(){
           that.$speedSel.combobox('showPanel'); 
        });
    }
});

//****************事件相关 end****************//





//****************UI state*********************//

_.extend(AnimatePanel.prototype,{

    /**
     * 设置添加按钮的  'add' 或者 'change'状态
     * @param {[type]} state [description]
     */
    setAddBtnType : function  (state) {
        if(state == 'add'){
            this.$addBtn
                .attr('type','add')
                .text('添加效果');
        }else if(state == 'change'){
            this.$addBtn
                .attr('type','change')
                .text('更改效果');
        }
    },

    setAddBtnEnabled:function  (isEnabled) {
        if(isEnabled){
            this.$addBtn.removeClass('disabled');
        }else{
            this.$addBtn.addClass('disabled');
        }
    },

    setDelBtnEnabled: function  (isEnabled) {
        if(isEnabled){
            this.$delBtn.removeClass('disabled');
        }else{
            this.$delBtn.addClass('disabled');
        }
    },

    setAllSelEnabled: function (isEnabled) {
        var that = this;
        this.$container.find('.animate-select-item').each(function(index, el) {
            setSelEnabled($(this),isEnabled);
        });
    },

    /**
     * 重新载入属性下拉框的数据
     * @param  {String} type  
     * @param  {JSON} perks 
     */
    attrSelReload : function  (type,perks) {
        var sel = this.$attrSel;
        switch (type) {
            case 'flyIn':
                perks.direction = perks.direction ? perks.direction : 'bottom';
                
                sel.combobox({
                    data: attrOptionsData['fly']
                });
                sel.combobox('select', perks.direction);
                
                break;

            case 'flyOut':
            case 'throwOut':
                perks.direction = perks.direction ? perks.direction : 'bottom';
                
                sel.combobox({
                    data: attrOptionsData['flyOut']
                });
                sel.combobox('select', perks.direction);
                
                break;

            case 'fadeIn':
            case 'fadeOut':
            case 'stressLightDarkSwitch':
            case 'stressRotateUpDown':
            case 'typeWriter':
                sel.combobox('select', '');
                sel.combobox({
                    data: attrOptionsData['fly']
                });
                sel.combobox('disable');
                break;
            case 'boxIn':
            case 'diamIn':
            case 'boxOut':
            case 'diamOut':
            case 'zoomIn':
            case 'zoomOut':
            case 'zoomRotateIn':
            case 'zoomRotateOut':
                perks.direction = perks.direction ? perks.direction : 'increase';
                
                sel.combobox({
                    data: attrOptionsData['other']
                });
                sel.combobox('select', perks.direction);
                
                break;
            case 'stressZoom':
                //不支持小数，所以要将数据放大
                perks.scale = perks.scale ? perks.scale : '1.5';
                var select_v = perks.scale * 100;

                var t_data = [];
                for (var t in attrOptionsData['zoom']) {
                    var t_item = attrOptionsData['zoom'][t];
                    t_data[t] = {
                        'label': t_item['label'],
                        value: parseFloat(t_item['value']) * 100
                    };
                }

                
                sel.combobox({
                    data: t_data
                });
                sel.combobox('select', select_v);
                
                break;
            case 'stressRotate':
                perks.rotate_info = perks.rotate_info ? perks.rotate_info : '1_1-0';
                
                sel.combobox({
                    data: attrOptionsData['rotate']
                });
                sel.combobox('select', perks.rotate_info);
                
                break;
            case 'stressTurn':
                perks.direction = perks.direction ? perks.direction : 'cb';
                sel.combobox({
                    data: attrOptionsData['turn']
                });
                sel.combobox('select', perks.direction);
                
                break;

            case 'stressShock':
                perks.direction = perks.direction ? perks.direction : 'lr';
                
                sel.combobox({
                    data: attrOptionsData['shock']
                });
                sel.combobox('select', perks.direction);
                
                break;

            case 'stressBigSmallSwitch':
                perks.direction = perks.direction ? perks.direction : 's2b';
                
                sel.combobox({
                    data: attrOptionsData['big_small']
                });
                sel.combobox('select', perks.direction);
                
                break;

            case animation.ATYPE_ACTION_PATH:
                sel.combobox('disable');
                break;
        }
    }
});


//****************UI state end*********************//


//***************工具方法*********************//



    /**
     * 获取编辑器当前选择的dom
     * @return {jq} 
     */
    function getSelectDom() {
        //var editor = root.getCurrentVisibleEditor(),
        //    selectDom = editor.plugins.layeredit.getCurrentSelectedLayers();
        var selectDom = $('<div id="'+ _.uniqueId('layer-') +'"></div>')
        return selectDom;
    }

    function setSelEnabled ($sel,isEnabled) {
        $sel.combobox(isEnabled ? 'enable' : 'disable');
        if(!isEnabled){
            $sel.combobox('clear');
        }
    }


//***************工具方法 end*********************//


/**
 * 可编辑属性对应在perks对象中的key
 * @type {Object}
 */
var editableAttrNameInPerks = {
    flyIn : 'direction',
    flyOut : 'direction',
    zoomIn : 'direction',
    zoomOut : 'direction',
    zoomRotateIn : 'direction',
    zoomRotateOut : 'direction',
    stressLightDarkSwitch : 'direction',
    stressRotateUpDown : 'rotate_info',
    stressZoom : 'direction',
    stressRotate : 'direction',
    stressRotate : 'direction',
    fadeIn : 'direction',
    fadeOut : 'direction',
}

/**
 * 翻译
 * @type {Object}
 */
var dictionary = {
    //state
    'in': '进入',
    'out': '退出',
    'stress': '强调',
    'path': '路径',

    //type
    'flyIn': '飞入',
    'flyOut': '飞出',
    'boxIn': '盒状',
    'boxOut': '盒状',
    'diamIn': '菱形',
    'zoomIn': '缩放',
    'zoomOut': '缩放',
    'zoomRotateIn': '旋转缩放',
    'zoomRotateOut': '旋转缩放',
    'stressLightDarkSwitch': '忽明忽暗',
    'stressRotateUpDown': '跷跷板',
    'stressZoom': '放大/缩小',
    'stressRotate': '陀螺旋',
    'stressTurn': '翻转',
    'diamOut': '菱形',
    'fadeIn': '淡入',
    'fadeOut': '淡出',
    'typeWriter': '打字机',
    'throwOut': '投掷',
    'stressShock': '震动',
    'stressBigSmallSwitch': '忽大忽小',

    //attr
    'increase': '放大',
    'decrease': '缩小',
    'left': '自左侧',
    'right': '自右侧',
    'mru': '对角线向右上',
    'mrd': '对角线向右下',
    'md': '向下',
    'ml': '向左',
    'mr': '向右',
    'mu': '向上',
    'top': '自顶部',
    'bottom': '自底部',

    //speed
    'auto': '自动',
    '1000': '中速',
    '100': '非常快',
    '500': '快速',
    '3000': '慢速',
    '5000': '非常慢',

    //trigger
    'click': '单击时',
    'sametime': '之前',
    'after': '之后',

    //img url
    'triggerImg': {
        'click': 'images/mouse.gif',
        'sametime': 'images/mouse.gif',
        'after': 'images/clock.png',
    }
};

/**
 * 属性的选项数据，属性下拉框会根据动画类型载入相应数据
 * @type {Object}
 */
var attrOptionsData= {
    'fly': [{
        label: '自顶部',
        value: 'top'
    }, {
        label: '自右侧',
        value: 'right'
    }, {
        label: '自底部',
        value: 'bottom'
    }, {
        label: '自左侧',
        value: 'left'
    }],
    'flyOut': [{
        label: '到顶部',
        value: 'top'
    }, {
        label: '到右侧',
        value: 'right'
    }, {
        label: '到底部',
        value: 'bottom'
    }, {
        label: '到左侧',
        value: 'left'
    }],
    'shock': [{
        label: '左右',
        value: 'lr'
    }, {
        label: '上下',
        value: 'tb'
    }],
    'big_small': [{
        label: '由大到小',
        value: 'b2s'
    }, {
        label: '由小到大',
        value: 's2b'
    }],
    'zoom': [{
        label: '微小(25%)',
        value: '0.25'
    }, {
        label: '小  (50%)',
        value: '0.5'
    }, {
        label: '较小(67%)',
        value: '0.67'
    }, {
        label: '较大(150%)',
        value: '1.5'
    }, {
        label: '大  (200%)',
        value: '2.0'
    }, {
        label: '巨大(400%)',
        value: '4.0'
    }],
    'rotate': [{
            label: '顺时针半旋转',
            value: '1_0-5'
        }, //1_0-5  表示： 1：顺时针，0：逆时针；  0-5 表示0.5，1-0 表示1.0
        {
            label: '顺时针全旋转',
            value: '1_1-0'
        }, {
            label: '逆时针半旋转',
            value: '0_0-5'
        }, {
            label: '逆时针全旋转',
            value: '0_1-0'
        }
    ],
    'turn': [{
        label: '沿中心左翻转',
        value: 'cl'
    }, {
        label: '沿中心右翻转',
        value: 'cr'
    }, {
        label: '沿中心上翻转',
        value: 'ct'
    }, {
        label: '沿中心下翻转',
        value: 'cb'
    }, {
        label: '沿左边线左翻转',
        value: 'll'
    }, {
        label: '沿右边线右翻转',
        value: 'rr'
    }, {
        label: '沿上边线上翻转',
        value: 'tt'
    }, {
        label: '沿下边线下翻转',
        value: 'bb'
    }],
    'other': [{
        label: '放大',
        value: 'increase'
    }, {
        label: '缩小',
        value: 'decrease'
    }]
};

/**
 * 默认动画数据的配置
 * @type {Object}
 */
var animationConfig = {
    _flyIn: function(selectDom) {
        var id = $(selectDom).attr('id');
            
        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'flyIn',
            state: 'in',
            speed: '1000',
            perks: {
                position: {},
                direction: 'bottom'
            }
        };
        return obj;
    },

    _flyOut: function(selectDom) {
        var id = $(selectDom).attr('id');
            
        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'flyOut',
            state: 'out',
            speed: '1000',
            perks: {
                position: {},
                direction: 'bottom'
            }
        };
        return obj;
    },

    _fadeIn: function(selectDom) {
        var id = $(selectDom).attr('id');
        
        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'fadeIn',
            state: 'in',
            speed: '1000',
            perks: {
                position: {}
            }
        };

        return obj;
    },

    _fadeOut: function(selectDom) {
        var id = $(selectDom).attr('id');
            
        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'fadeOut',
            state: 'out',
            speed: '1000',
            perks: {
                position: {}
            }
        };

        return obj;
    },

    _boxIn: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'boxIn',
            state: 'in',
            speed: '1000',
            perks: {
                position: {},
                direction: 'increase'
            }
        };

        return obj;
    },

    _boxOut: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'boxOut',
            state: 'out',
            speed: '1000',
            perks: {
                position: {},
                direction: 'increase'
            }
        };

        return obj;
    },

    _zoomIn: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'zoomIn',
            state: 'in',
            speed: '1000',
            perks: {
                position: {},
                direction: 'increase'
            }
        };
        return obj;
    },

    _zoomOut: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'zoomOut',
            state: 'out',
            speed: '1000',
            perks: {
                position: {},
                direction: 'decrease'
            }
        };

        return obj;
    },

    _zoomRotateIn: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'zoomRotateIn',
            state: 'in',
            speed: '1000',
            perks: {
                position: {},
                direction: 'increase'
            }
        };

        return obj;
    },

    _zoomRotateOut: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'zoomRotateOut',
            state: 'out',
            speed: '1000',
            perks: {
                position: {},
                direction: 'decrease'
            }
        };

        return obj;
    },

    _diamIn: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'diamIn',
            state: 'in',
            speed: '1000',
            perks: {
                position: {},
                direction: 'increase'
            }
        };
        return obj;
    },

    _diamOut: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'diamOut',
            state: 'out',
            speed: '1000',
            perks: {
                position: {},
                direction: 'increase'
            }
        };
        return obj;
    },

    _stressLightDarkSwitch: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'stressLightDarkSwitch',
            state: 'stress',
            speed: '500',
            perks: {
                position: {},
                direction: ''
            }
        };
        return obj;
    },

    _stressRotateUpDown: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'stressRotateUpDown',
            state: 'stress',
            speed: '500',
            perks: {
                position: {},
                direction: ''
            }
        };
        return obj;
    },

    _stressZoom: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'stressZoom',
            state: 'stress',
            speed: '1000',
            perks: {
                position: {},
                direction: '',
                scale: 1.5
            }
        };
        return obj;
    },

    _stressRotate: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'stressRotate',
            state: 'stress',
            speed: '1000',
            perks: {
                position: {},
                direction: '',
                rotate_info: ''
            }
        };

        return obj;
    },

    _stressTurn: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'stressTurn',
            state: 'stress',
            speed: '1000',
            perks: {
                position: {},
                direction: '',
                rotate_info: ''
            }
        };

        return obj;
    },

    _typeWriter: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'typeWriter',
            state: 'in',
            speed: '1000',
            perks: {
                position: {},
                direction: '',
                rotate_info: ''
            }
        };

        return obj;
    },

    _throwOut: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'throwOut',
            state: 'out',
            speed: '1000',
            perks: {
                position: {},
                direction: 'left',
                rotate_info: ''
            }
        };

        return obj;
    },

    _stressShock: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'stressShock',
            state: 'stress',
            speed: '500',
            perks: {
                position: {},
                direction: 'lr',
                rotate_info: ''
            }
        };

        return obj;
    },

    _stressBigSmallSwitch: function(selectDom) {
        var id = $(selectDom).attr('id');
            

        //默认值
        var obj = {
            id: id,
            trigger: 'click',
            type: 'stressBigSmallSwitch',
            state: 'stress',
            speed: '1000',
            perks: {
                position: {},
                direction: 'b2s',
                rotate_info: ''
            }
        };

        return obj;
    },
}

 
module.exports = AnimatePanel;