import React from 'react';
import {
    View,
    Animated,
    StyleSheet,
    TouchableHighlight,
    TouchableOpacity,
    PanResponder, 
    Text, Dimensions,Easing
} from 'react-native';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import PropTypes from 'prop-types';

// const labels = ['0', '200', '400', '600', '1000', '不限'];
const labels = ['¥0-150', '¥0-300','¥300-450', '¥450-600','¥600-1000', '¥1000以上', ''];
/* 尺寸转换方法
 * _px: 以750位基准的转屏幕
 * _pos: 以屏幕为基准的转750
 */
const _getDw = () => {
    const w = global.screenWidth || Dimensions.get('window').width;
    return w || 375;
};
const _getRatioDeps750 = () => _getDw() / 750;
const _px = function getRpx(value) {
    return Math.floor(value * _getRatioDeps750());
}
const _pos = function getPos(value) {
    return Math.floor(value / _getRatioDeps750())
}

/* 尺寸相关 
 * excludeWidth: 距离屏幕左右边界的距离，不触发点击滑动等事件的区域
 * unitWidth: 每一个单位的总宽度，有效区域等分后的宽度
 * labelWidth: 每一个单位的有效的点击宽度
 * sliderWidth: 滑块的宽度
 * sliderInitialLeft: 第一个滑块的left
 */
const excludeWidth = 10;
const unitWidth = (750 - excludeWidth * 2) / labels.length; //100
const labelWidth = unitWidth - 20; // 两个标签核心之间间隙 40
const sliderWidth = 60;
const halfUnitWidth = unitWidth / 2; // slider:halfUnitWidth - sliderWidth / 2; line:halfUnitWidth


const duration = 300;
const easing = Easing.linear;

export default class ListStartView extends React.Component {

    static propTypes = {
        callBack: PropTypes.func.isRequired
    }

    constructor(props) {
        super(props);
        let leftBoundaryForLeft = 0;
        let rightBoundaryForLeft = 0;
        let validPosForLeft = 0;
        let leftBoundaryForRight = 0;
        let rightBoundaryForRight = 0;
        let validPosForRight = 0;

        this.state = {
            visible: false,
            animateOpacity: new Animated.Value(0.6),
            animatedHeight: new Animated.Value(_px(600)),
            // lowPrice: '',
            // HeightPrice: '',
            // selectStart: [],

            leftIndex: 0,
            rightIndex: 6,
            leftPos: new Animated.Value(halfUnitWidth),
            rightPos: new Animated.Value(labels.length * unitWidth - halfUnitWidth)
        }
        this._leftSliderPanResponder = PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onShouldBlockNativeResponder: (evt, gestureState) => true,
            onPanResponderGrant: (evt, gestureState) => {
                // 左边界
                leftBoundaryForLeft = excludeWidth + halfUnitWidth;
                // 右边界
                rightBoundaryForLeft = this.state.rightIndex * unitWidth + excludeWidth + halfUnitWidth;
                validPosForLeft = _pos(gestureState.x0)
            },
            onPanResponderMove: (evt, gestureState) => {
                //手势中心点
                let centerX = _pos(gestureState.moveX)
                if (centerX >= leftBoundaryForLeft && centerX <= rightBoundaryForLeft - unitWidth) {
                    this.state.leftPos.setValue(centerX - excludeWidth);
                    validPosForLeft = centerX
                    let posIndex = Math.floor((validPosForLeft - excludeWidth) / unitWidth);
                    this.setState({
                        leftIndex: posIndex
                    })
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                let posIndex = Math.floor((validPosForLeft - excludeWidth) / unitWidth);
                this.setPos({ leftIndex: posIndex })
            },
            onPanResponderTerminate: (evt, gestureState) => {

            },

        });
        this._rightSliderPanResponder = PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onShouldBlockNativeResponder: (evt, gestureState) => true,
            onPanResponderGrant: (evt, gestureState) => {
                // 左边界
                leftBoundaryForRight = this.state.leftIndex * unitWidth + excludeWidth + halfUnitWidth;
                // 右边界
                rightBoundaryForRight = 750 - excludeWidth - halfUnitWidth;
                validPosForRight = _pos(gestureState.x0)
            },
            onPanResponderMove: (evt, gestureState) => {
                //手势中心点
                let centerX = _pos(gestureState.moveX)
                if (centerX >= leftBoundaryForRight + unitWidth && centerX <= rightBoundaryForRight) {
                    this.state.rightPos.setValue(centerX - excludeWidth);
                    validPosForRight = centerX;
                    let posIndex = Math.floor((validPosForRight - excludeWidth) / unitWidth);
                    this.setState({
                        rightIndex: posIndex
                    })
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                let posIndex = Math.floor((validPosForRight - excludeWidth) / unitWidth);
                this.setPos({ rightIndex: posIndex })
            },
            onPanResponderTerminate: (evt, gestureState) => {

            },
        });
        this._viewPanResponder = PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
            onPanResponderTerminationRequest: (evt, gestureState) => true,
            onShouldBlockNativeResponder: (evt, gestureState) => true,
            onPanResponderGrant: (evt, gestureState) => {

            },
            onPanResponderMove: (evt, gestureState) => {

            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.moveX) {
                    return;
                }
                let x = _pos(gestureState.x0);
                if ((x - excludeWidth) % unitWidth < (unitWidth - labelWidth) / 2 || (x - excludeWidth) % unitWidth > unitWidth - (unitWidth - labelWidth) / 2) {
                    console.log('无效点')
                    return;
                }
                let posIndex = Math.floor((x - excludeWidth) / unitWidth);

                let { leftIndex, rightIndex } = this.state;
                let leftPos = leftIndex * unitWidth + halfUnitWidth;
                let rightPos = rightIndex * unitWidth + halfUnitWidth;

                // 距离左边的点更近
                if (Math.abs(x - excludeWidth - leftPos) <= Math.abs(x - excludeWidth - rightPos)) {
                    this.setPos({ leftIndex: posIndex === rightIndex ? posIndex - 1 : posIndex })
                } else {
                    this.setPos({ rightIndex: posIndex === leftIndex ? posIndex + 1 : posIndex })
                }
            },
            onPanResponderTerminate: (evt, gestureState) => {

            },

        });

    }

    show(lowPrice, HeightPrice) {
        const leftIndex = lowPrice ? Math.floor(Number(lowPrice) / 150) : 0;
        const rightIndex = HeightPrice
            ? (HeightPrice == '以上' ? 6 : (Number(HeightPrice) > 600 && Number(HeightPrice) <= 1000) ? 5 : Math.floor(Number(HeightPrice) / 150))
            : 6;
        this.setState({
            visible: true,
            leftIndex: leftIndex,
            rightIndex: rightIndex
            // lowPrice,
            // HeightPrice,
            // selectStart
        }, () => {
            requestAnimationFrame(() => {
                this.setPos({ leftIndex, rightIndex });
            });
        })
    }

    hide = () => {
        this.setState({
            visible: false
        })
    }
    _hide = () => {
        this.setState({
            visible: false
        })
    }

    _sureBtnClick = () => {
        const { leftIndex, rightIndex } = this.state;
            let _lowPrice= leftIndex==1 ? 0 :leftIndex==5?1000:  leftIndex*150
            let _HeightPrice = rightIndex>4 ? (rightIndex>5?'以上':'1000') : rightIndex*150
            this.setState({
                visible: false
            })
            this.props.callBack(_lowPrice, _HeightPrice);
    }

    _reset = ()=>{
        // this.setState({
        //     // lowPrice:"0",
        //     // HeightPrice:'以上',
        //     leftIndex:0,
        //     rightIndex:6
        //     // selectStart:['不限']
        // })
        this.setPos({ leftIndex: 0, rightIndex: 6})
    }

    setPos({ leftIndex, rightIndex }) {
        if (leftIndex >= 0) {
            Animated.parallel([
                Animated.timing(this.state.leftPos, {
                    toValue:leftIndex===1?halfUnitWidth:leftIndex * unitWidth + halfUnitWidth,
                    duration,
                    easing,
                    useNativeDriver: false,
                })
            ]).start(() => {
                this.setState({
                    leftIndex: leftIndex
                })
            })
        }
        if (rightIndex >= 0) {
            Animated.parallel([
                Animated.timing(this.state.rightPos, {
                    toValue:rightIndex===0?halfUnitWidth: rightIndex * unitWidth + halfUnitWidth,
                    duration,
                    easing,
                    useNativeDriver: false,
                }),
            ]).start(() => {
                this.setState({
                    rightIndex: rightIndex
                })
            })
        }
    }

    componentDidMount() {
        this.setPos({ leftIndex: 0, rightIndex: labels.length - 1 })
    }

    render() {
        const { visible, animateOpacity, animatedHeight, leftPos, rightPos, leftIndex, rightIndex } = this.state;
        if (!visible) return null;
        const dw = _getDw();
        let lefttext2 = leftIndex==1 ? 0+ '-' : 
                        leftIndex==5?'':(leftIndex*150+ '-')
        return (
            <View style={{ position: 'absolute', left: 0, right: 0, top: 50, bottom: 0 }}>
                <Animated.View style={{ height: animatedHeight, backgroundColor: '#fff' }}>
                    <View style={styles.container}>
                        <View style={{backgroundColor:'#fff'}}>
                            <View style={{flexDirection:'row'}}>
                                <CustomText style={{ marginLeft: 10, marginTop: 10,fontSize:14 }} text={'价格'} />
                                <CustomText style={{ marginLeft: 10, marginTop: 10,fontSize:14 }} text={'¥ '} />
                                {
                                    <CustomText style={{ marginTop: 10,color:Theme.theme,fontSize:14 }} text={
                                        lefttext2
                                         + 
                                        (rightIndex?( rightIndex>4 ? (rightIndex>5?'1000+':'1000') :rightIndex*150 ):'1000+')} />
                                }
                            </View>
                            <View style={{flexDirection:'row',justifyContent: 'space-between',marginHorizontal: 10, marginTop: 15,marginBottom:-10,}}>
                                <CustomText style={{ fontSize:12,color:Theme.assistFontColor }} text={'¥0'} />
                                <CustomText style={{ fontSize:12,color:Theme.assistFontColor }} text={'¥1000以上'} />
                            </View>
                            <View style={styles.content}>
                                <View {...this._viewPanResponder.panHandlers} style={styles.pan} >
                                    <View style={styles.labels}/>
                                    <View style={styles.lines}>
                                        <View style={styles.line} />
                                        <Animated.View style={{
                                            ...StyleSheet.flatten(styles.hl_line),
                                            left: leftPos.interpolate({
                                                inputRange: [halfUnitWidth, labels.length * unitWidth - halfUnitWidth],
                                                outputRange: [_px(halfUnitWidth), _px(labels.length * unitWidth - halfUnitWidth)],
                                                extrapolate: 'clamp',
                                            }),
                                            right: rightPos.interpolate({
                                                inputRange: [halfUnitWidth, labels.length * unitWidth - halfUnitWidth],
                                                outputRange: [_px(labels.length * unitWidth - halfUnitWidth), _px(halfUnitWidth)],
                                                extrapolate: 'clamp',
                                            })
                                        }} />
                                    </View>
                                </View>
                                <Animated.Image {...this._leftSliderPanResponder.panHandlers} source={images.slider} style={{
                                    ...StyleSheet.flatten(styles.slider),
                                    left: leftPos.interpolate({
                                        inputRange: [halfUnitWidth, labels.length * unitWidth - halfUnitWidth],
                                        outputRange: [_px(halfUnitWidth), _px(labels.length * unitWidth - halfUnitWidth)],
                                        extrapolate: 'clamp',
                                    }),
                                }} />
                                <Animated.Image {...this._rightSliderPanResponder.panHandlers} source={images.slider} style={{
                                    ...StyleSheet.flatten(styles.slider),
                                    left: rightPos.interpolate({
                                        inputRange: [halfUnitWidth, labels.length * unitWidth - halfUnitWidth],
                                        outputRange: [_px(halfUnitWidth), _px(labels.length * unitWidth - halfUnitWidth)],
                                        extrapolate: 'clamp',
                                    }),
                                }} />
                                <View style={styles.labels2}>
                                    {labels.map((item, index) => {
                                        return (
                                            index===0?null:
                                            <TouchableOpacity style={{ backgroundColor:Theme.greenBg,
                                                                            width:(dw-50)/3 ,borderWidth:!item ? 0 :1, borderColor: !item ? '#fff' : (index < leftIndex || index >= rightIndex ? '#999' : Theme.theme),
                                                                            backgroundColor:!item ? '#fff' : (index < leftIndex || index >= rightIndex ? '#fff' : Theme.greenBg),
                                                                            borderColor: !item ? '#fff' : (index < leftIndex || index >= rightIndex ? '#999' : Theme.theme),height:32,marginTop:10,
                                                                            alignItems:'center',justifyContent: "center",borderRadius:3
                                                                    }}
                                                                onPress={()=>{
                                                                        this.setPos({ leftIndex: index, rightIndex: index+1})
                                                                }}
                                            >
                                                <CustomText text={item} style={{color:!item ? '#fff' : (index < leftIndex || index >= rightIndex ? '#999' : Theme.theme)}}></CustomText>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </View>
                            </View>
                        </View>
                        <View style={styles.bottomBar}>
                                <TouchableHighlight underlayColor='transparent' style={{ flex: 1,height:40 }} onPress={this._reset}>
                                    <View style={[{ borderColor: Theme.theme, borderWidth: 1 }, styles.bottom_btn]}>
                                        <CustomText text='重置' style={{ color: Theme.theme ,fontSize:16}} />
                                    </View>
                                </TouchableHighlight>
                                <TouchableHighlight underlayColor='transparent' style={{ flex: 1,height:40 }} onPress={this._sureBtnClick}>
                                    <View style={[{ backgroundColor: Theme.theme }, styles.bottom_btn]}>
                                        <CustomText text='确定' style={{ color: 'white',fontSize:16 }} />
                                    </View>
                                </TouchableHighlight>
                        </View>
                    </View>
                </Animated.View>
                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={this._hide} underlayColor='transparent'>
                    <Animated.View style={{ flex: 1, backgroundColor: 'black', opacity: animateOpacity }} />
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    priceBtn: {

        height: 20,
        borderWidth: 1,
        borderColor: Theme.lineColor,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'
    },
    startBtn: {

        height: 30,
        borderColor: Theme.lineColor,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: 'center',

    },
    bottom_btn: {
        // flex: 1,
        height: 40,
        marginHorizontal: 10,
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
    },
//    groundColor: '#ccc',
   container: {
    // height: _px(280),
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'space-between',
},
bottomBar: {
    flexDirection: 'row',
    height: 60,
    justifyContent: "center",
    alignItems:'center',
    borderTopWidth: 1,
    borderColor: Theme.normalBg,
    backgroundColor: '#fff',
},
content: {
    backgroundColor: '#fff',
    // height: _px(180),
    position: 'relative',
    marginHorizontal: _px(excludeWidth),
    marginVertical: _px(30),
},
pan: {
    backgroundColor: '#fff',
},
labels: {
    height: _px(10),
    // flexDirection: 'row',
    // justifyContent: 'space-around',
    // alignItems: 'center'
},
labels2: {
    height: _px(180),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    // width:150,
    flexWrap:'wrap',
    marginTop:15,
    // backgroundColor:'red'
},
label: {
    width: _px(labelWidth),
    // textAlign: 'center',
    alignItems:'center',
    marginTop:10,
    height:32,
    justifyContent: 'center',
    // borderWidth:1
    borderRadius:2,
    borderColor:Theme.theme
},
lines: {
    height: _px(60),
    justifyContent: 'center',
    // backgroundColor:'pink'
},
line: {
    position: 'absolute',
    backgroundColor: '#ddd',
    height: _px(8),
    left: _px(halfUnitWidth),
    right: _px(halfUnitWidth)
},
hl_line: {
    position: 'absolute',
    backgroundColor: Theme.theme,
    height: _px(8),
},
slider: {
    width: _px(sliderWidth),
    height: _px(sliderWidth),
    // width: 20,
    // height: 20,
    resizeMode: 'contain',
    position: 'absolute',
    zIndex: 2,
    top: _px(40),
    transform: [{
        translateX: -_px(sliderWidth /2),
    }, {
        translateY: -_px(sliderWidth /2),
    }]
}
})
const images = {
    slider: require('../../res/Uimage/hotelFloder/sliderBtn.png')
}
