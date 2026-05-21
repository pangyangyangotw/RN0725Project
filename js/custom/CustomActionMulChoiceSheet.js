
import React from 'react';
import {
    View, Modal, Animated, StyleSheet, ScrollView, TouchableHighlight, TouchableOpacity
} from 'react-native';
import CustomText from './CustomText';
import PropTypes from 'prop-types';
import Theme from '../res/styles/Theme';
import DeviceUtil from '../util/DeviceUtil';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
let CancelButtonHeight = DeviceUtil.is_iphonex() ? 84 : 50;
let multArr = [];
export default class CustomActionMulChoiceSheet extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            modelOpacity: new Animated.Value(0),
            modelHeight: new Animated.Value(0),
            multSelectItems:[],//多选后的数组
            selectSame:false,
        }
    }
    /**
     *  规定用法
     */
    static propTypes = {
        title: PropTypes.string,
        options: PropTypes.array.isRequired,
        onPress: PropTypes.func.isRequired,
        select: PropTypes.any
    }
    show() {
        this.setState({
            visible: true
        }, () => {
            Animated.parallel([
                Animated.timing(this.state.modelOpacity, {
                    toValue: 0.6,
                    duration: 300
                }),
                Animated.timing(this.state.modelHeight, {
                    toValue: this._getHeight(),
                    duration: 300
                })
            ]).start();
        })

    }
    _hide = () => {
        Animated.parallel([
            Animated.timing(this.state.modelOpacity, {
                toValue: 0,
                duration: 300
            }),
            Animated.timing(this.state.modelHeight, {
                toValue: 0,
                duration: 300
            })
        ]).start(() => {
            this.setState({
                visible: false
            })
        });
    }
    // _sureSelect = ()=> {
        
    //     Animated.parallel([
    //         Animated.timing(this.state.modelOpacity, {
    //             toValue: 0,
    //             duration: 300
    //         }),
    //         Animated.timing(this.state.modelHeight, {
    //             toValue: 0,
    //             duration: 300
    //         })
    //     ]).start(() => {
    //         this.setState({
    //             visible: false
    //         }, () => {
    //             this.props.onPress(this.state.multSelectItems);
    //         })
    //     });
    // }

    _hideBack = (index) => {
        Animated.parallel([
            Animated.timing(this.state.modelOpacity, {
                toValue: 0,
                duration: 300
            }),
            Animated.timing(this.state.modelHeight, {
                toValue: 0,
                duration: 300
            })
        ]).start(() => {
            this.setState({
                // multSelectItems:[],
                visible: false
            }, () => {
                // this.props.onPress(this.state.multSelectItems);
            })
        });
    }
   _multSelect =(item,index) => {
        const { chaobiao,options,ticket,setSelects,_this,feeType } = this.props;
        if(ticket&&!ticket.RcReason){
            if(feeType&&feeType===1&&chaobiao&&chaobiao[index]==0){
                this._hideBack()
                _this.push('RcReason', { ticket ,callBack:(reason)=>{
                    if(reason){
                        if(this.state.multSelectItems.indexOf(item) > -1){
                            var resultArr=this.state.multSelectItems;
                            resultArr.splice(this.state.multSelectItems.indexOf(item), 1);
                            this.setState({
                                multSelectItems:resultArr
                            })
                        }else{
                            this.state.multSelectItems.push(item);
                            var resultArr;
                            resultArr = this.state.multSelectItems.filter(function (item, index, self) {
                               return self.indexOf(item) == index;
                            });
                            this.setState({
                                multSelectItems:resultArr
                            })
                        }
                        this.props.onPress(this.state.multSelectItems);
    
                    }
                }});      
            }else{
                if(this.state.multSelectItems.indexOf(item) > -1){
                    var resultArr=this.state.multSelectItems;
                    resultArr.splice(this.state.multSelectItems.indexOf(item), 1);
                    this.setState({
                        multSelectItems:resultArr
                    })
                }else{
                    this.state.multSelectItems.push(item);
                    var resultArr;
                    resultArr = this.state.multSelectItems.filter(function (item, index, self) {
                       return self.indexOf(item) == index;
                    });
                    this.setState({
                        multSelectItems:resultArr
                    })
                }
                this.props.onPress(this.state.multSelectItems);
            }
        }else{
            if(this.state.multSelectItems.indexOf(item) > -1){
                var resultArr=this.state.multSelectItems;
                resultArr.splice(this.state.multSelectItems.indexOf(item), 1);
                this.setState({
                    multSelectItems:resultArr
                })
            }else{
                this.state.multSelectItems.push(item);
                var resultArr;
                resultArr = this.state.multSelectItems.filter(function (item, index, self) {
                   return self.indexOf(item) == index;
                });
                this.setState({
                    multSelectItems:resultArr
                })
            }
            this.props.onPress(this.state.multSelectItems);
        }     
   }
   
    _getHeight = () => {
        const { options } = this.props;
        if (options.length < 8) {
            return CancelButtonHeight + options.length * 50 ;
        } else {
            return CancelButtonHeight + 8 * 50 ;
        }
    }

    _detailOptions = () => {
        const { options } = this.props;
        let values = [
            <CustomText text='取消' style={{ color: Theme.theme, fontSize: 18 }} />
        ]
        options.forEach(item => {
            if (typeof item === 'number' || typeof item === 'string') {
                values.push(<CustomText text={item} />)
            }
        })
        return values;
    }

    render() {
        const { title, options, select, chaobiao,feeType,ticket} = this.props;
        const { visible, modelOpacity, modelHeight,multSelectItems } = this.state;
        return (
            <Modal transparent visible={visible}>
                <TouchableOpacity style={{ flex: 1 }} underlayColor='white' onPress={this._hide}>
                    <Animated.View style={{ backgroundColor: 'black', flex: 1, opacity: modelOpacity }}>
                    </Animated.View>
                </TouchableOpacity>
                <View style={{ backgroundColor: Theme.normalBg }}>
                    <Animated.View style={{ height: modelHeight, }}>
                        <View style={styles.titleHeader}>
                            {
                                typeof title === 'string' || !title ?
                                    <CustomText text={title || '请选择'} style={{ color: Theme.theme, fontSize: 18 }} />
                                    :
                                    title
                            }
                        </View>
                        {
                                options.map((item, index) => {
                                    if(!item){return};
                                    return (
                                        <TouchableHighlight key={index} underlayColor='transparent' onPress={() => {
                                            this._multSelect(item,index);
                                        }}>
                                            
                                            <View style={[styles.buttonView, { borderBottomWidth: index === options.length - 1 ? 0 : 1 }]}>
                                                {
                                                    typeof item === 'string' ?
                                                        <View style={{flexDirection:'row',alignItems:'center'}}>
                                                           <CustomText text={item} style={{ fontSize: 14, color: item === select ? Theme.specialColor2 : null }} />
                                                           {
                                                               chaobiao&&chaobiao[index]===0&&(feeType&&feeType===1)?
                                                                 <CustomText text={' 超标'} style={{ fontSize: 11, color:'red'}} />
                                                               :null
                                                           }
                                                        </View>
                                                        :
                                                        item  
                                                }
                                                {
                                                    this.state.multSelectItems.map((items,index)=>{
                                                        if(item==items){
                                                            return(
                                                                <AntDesign
                                                                name={'check'}
                                                                size={28}
                                                                key={index}
                                                                color={Theme.theme}
                                                               />
                                                            )
                                                        }
                                                    })                
                                                } 
                                            </View>
                                        </TouchableHighlight>
                                    )
                                })
                        }
                        <View underlayColor='transparent'>
                            {/* <View style={styles.cancelButtonBox}>
                                <TouchableOpacity style={styles.cancelView} onPress={this._hideBack}>
                                    <CustomText text='取消' style={{ color: Theme.theme, fontSize: 18 }} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelView} onPress={this._sureSelect}>
                                    <CustomText text='确定' style={{ color: Theme.theme, fontSize: 18 }} />
                                </TouchableOpacity>
                            </View> */}
                        </View>
                    </Animated.View>
                </View>
            </Modal >
        )
    }
}

const styles = StyleSheet.create({
    titleHeader: {
        height: 40,
        justifyContent: 'center',
        alignItems: "center",
        backgroundColor: 'white',
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1
    },
    buttonView: {
        height: 50,
        paddingLeft: 15,
        paddingRight: 15,
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: "white",
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        flexDirection:'row',
    },
    cancelButtonBox: {
        height: CancelButtonHeight,
        marginTop: 6,
        paddingBottom: DeviceUtil.is_iphonex() ? 34 : 0,
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        flexDirection:'row'
    },
    cancelView: {
        height: 50,
        width:150,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
    }
})

