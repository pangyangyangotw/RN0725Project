import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Image
} from 'react-native';
import CustomText from './CustomText';
import CustomeTextInput from './CustomTextInput';
import ToastView from './ToastView';
import Theme from '../res/styles/Theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Util from '../util/Util';
import AntDesign from 'react-native-vector-icons/AntDesign';


/**
 * 高亮*提示
 */
export default class HighLight extends React.Component {
    render() {
        const { name,style } = this.props;
        return (
            // value?<CustomText text={name} style={{flex: 3 }} />:
            <View style={{flexDirection:'row',alignItems:'center'}}>
                <CustomText text={name} style={style}/>
                <CustomText text={'*'} style={{  color:'red',fontSize:18,marginTop:3}} />
            </View>            
        );
    }
}
export class HighLight2 extends React.Component {
    render() {
        const { name, value1, value2,style } = this.props;
        return (
            value1&&value2?<CustomText text={name}  />:
            <View style={{flexDirection:'row',alignItems:'center'}}>
                <CustomText text={name}  style={[{color:Theme.commonFontColor, fontSize:14},style]}/>
                <CustomText text={'*'} style={{  color:'red',fontSize:18,marginLeft:2,marginTop:3}} />
            </View>            
        );
    }
}

export class TitleView extends React.Component {
    render() {
        const { title,style } = this.props;
        return (
            <View style={[{  paddingHorizontal: 10, paddingVertical: 15,flexDirection:'row',alignItems: 'center',borderRadius:6 },style]}>
                <Image source={require('../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                <CustomText text={title}  style={{fontSize:14,color:Theme.fontColor,fontWeight:'bold'}}/>
            </View>          
        );
    }
}
export class TitleView2 extends React.Component {
    render() {
        const { title,style,required } = this.props;
        return (
            <View>
            <View style={[{ flexDirection:'row',alignItems: 'center' },style]}>
                <Image source={require('../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                <CustomText text={title}  style={{fontSize:14,color:Theme.fontColor,fontWeight:'bold'}}/>
                {required ? <CustomText text={'*'} style={{  color:'red',fontSize:18,marginTop:3}} /> : null}
            </View> 
            </View>         
        );
    }
}

/**
 * 编辑人员信息必填样式，
 * required （true 判断是必填项）
 * dicKey（类目）
 * bt_text（必填信息）
 * _placeholder(提示语)
 * _callBack（传回填写的值）
 * warm_text（提示文字，例：需与文件一致）
 * keyboardType（键盘类型）
 * no_editable 是否不允许编辑
 * _haveInfoAler 是否有提示信息按钮
 * _clickOnpress 提示点击事件
 * 
 */
export class Bt_inputView extends React.Component {
    constructor(props) {
        super(props);
        this._enNameToastTs = 0;
    }
    render() {
        const { dicKey, bt_text, _placeholder, warm_text, _callBack,_onFocus,_onBlur, keyboardType,required,no_editable,_haveInfoAler,_clickOnpress,isEnName} = this.props;
        const displayValue = (isEnName && bt_text && /[^a-zA-Z'\s]/.test(bt_text)) ? '' : bt_text;
        return (
            <View style={[styles.row, { borderBottomColor: required ? ( displayValue ? Theme.lineColor : Theme.redColor ) : Theme.lineColor}]}>
                <View style={{flexDirection:'row',alignItems:'center',flex:Util.Parse.isChinese()?0:3}}>
                    <CustomText text={dicKey} style={styles.textsy}/>
                    {required ? <CustomText text={'*'} style={{  color:'red',fontSize:18,marginTop:3}} /> : null}
                    {_haveInfoAler ? 
                            <TouchableOpacity underlayColor='transparent' 
                               onPress={()=>{ _clickOnpress() }}>
                                <AntDesign name={'questioncircleo'} size={18} color={Theme.theme} style={{ marginLeft: 5 }} />
                            </TouchableOpacity>
                     : null}
                </View> 
                <CustomeTextInput style={styles.input} 
                    placeholder={_placeholder}
                    editable={no_editable?false:true} 
                    value={displayValue}
                    onFocus={() =>{
                        _onFocus?_onFocus():null
                    }}
                    onBlur={() => {
                        _onBlur?_onBlur():null
                    }}
                    keyboardType={keyboardType} 
                    onChangeText={text => {
                        const next = isEnName ? (text || '').replace(/[^a-zA-Z'\s]/g, '') : text;
                        if (isEnName && text !== next) {
                            const now = Date.now();
                            if (now - this._enNameToastTs > 800) {
                                this._enNameToastTs = now;
                                this._toast && this._toast.show('必须输入英文字母');
                            }
                        }
                        _callBack(next)
                    }} 
                />
                <ToastView ref={ref => this._toast = ref} position={'center'} />
                <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 10 }}>
                    {warm_text ? <CustomText text={warm_text} style={{ color: Theme.theme }} /> : null}
                </View>
            </View>       
        );
    }
}

export class No_inputView extends React.Component {
    render() {
        const { dicKey,dicValue} = this.props;
        return (
            // <View style={{backgroundColor:'#ffa',height:50,justifyContent:'center'}}>
                <CustomText style={{alignItems:'center', justifyContent:'center',color:Theme.commonFontColor,fontSize:14,marginLeft:15}} text={dicKey} />
            // </View>     
        );
    }
}

/**
 * 国籍、签发国等选择View
 * titleName
 * NationName  国家名称
 * _placeholder
 * 
 */
export class SelectView extends React.Component {
    render(){
        const {titleName,_selectName, _callBack,required,_placeholder,_haveInfoAler,_clickOnpress} = this.props;
        return(
            <View style={[styles.row2,{borderBottomColor:required ?(_selectName?Theme.lineColor:Theme.redColor):Theme.lineColor}]}>
                    {
                            required
                            ?
                            <HighLight  name={titleName} style={styles.textsy}/>
                            :
                            <CustomText text={titleName} style={styles.textsy} />
                            
                    }
                    {_haveInfoAler ? 
                            <TouchableOpacity underlayColor='transparent' 
                               onPress={()=>{ _clickOnpress() }}>
                                <AntDesign name={'questioncircleo'} size={18} color={Theme.theme} style={{ marginLeft: 5 }} />
                            </TouchableOpacity>
                     : null}  
                    <TouchableOpacity style={[styles.right]} onPress={()=>{ _callBack() }} >
                        {
                             titleName==='出生日期'?
                             <CustomText style={[styles.textsy,{ flex: 1, color: _selectName ? 'black' : 'lightgray',paddingVertical:1 }]} 
                                    text={_selectName ? Util.Read.simpleReplaceBirth(_selectName) : _placeholder} 
                             />:
                             <CustomText style={[styles.textsy,{ flex: 1, color: _selectName? 'black' : 'lightgray',paddingVertical:1 }]} text={_selectName ? _selectName : _placeholder} />
                        }
                        {
                             titleName==='审批授权人'?
                             <View style={styles.shouquanstyle} >
                             <CustomText style={{color:Theme.theme}} text={'添加'}/>
                             </View>
                             :
                             <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} />
                        }
                        {/* <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} /> */}
                    </TouchableOpacity>
            </View>
        )
    }
}

/**
 * 编辑信息 字典项
 * _callBack（传回填写的值）
 * 
 */
export class InfoDicView extends React.Component {
    render() {
        const {index,obj,itemIndex,value_Change,select_DicList,editable,haveHotel} = this.props;
        return (
            !haveHotel || !obj.IsShowWhenMissingHotelUnitInMassOrder?
            <View key={index} style={{flexDirection: 'column',  borderBottomWidth: 1,borderBottomColor: obj.IsRequire&& (!itemIndex || !itemIndex.ItemName)? Theme.redColor :Theme.lineColor,marginBottom:10 }}>
                {obj.IsRequire?<HighLight name={obj.Name}  style={styles.textsy}/> : <CustomText text={obj.Name} style={{ color:Theme.commonFontColor,fontSize:14,marginTop:12 }} />}
                <View>
                {
                    obj.NeedInput?
                        <View >
                            <CustomeTextInput 
                                              style={{ height:40,marginLeft:-3 }} 
                                              value={itemIndex && itemIndex.ItemName} 
                                              placeholder={Util.Parse.isChinese() ?obj.Remark?obj.Remark:obj.IsRequire?'（必填）':'（选填）': obj.EnRemark}
                                              editable={editable?editable:obj.IsEditInput} 
                                              onChangeText={(text) => {
                                                  value_Change(text)
                                              }} 
                            />
                        </View>
                        :
                        <View style={{ flexDirection: 'row', alignItems: 'center',paddingTop:10,paddingVertical:10  }}>
                            <CustomText text={itemIndex ? itemIndex.ItemInput : (Util.Parse.isChinese() ?obj.Remark: obj.EnRemark) } style={{ color: itemIndex ? Theme.fontColor : 'lightgray', flex: 1,fontSize:14 }} 
                                        onPress={()=>{
                                            select_DicList()
                                        }} 
                            />
                            <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} />
                        </View>
                }
                </View>
            </View>:null
        );
    }
}

const styles = StyleSheet.create({
    row: {
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomColor: Theme.lineColor,
        borderBottomWidth:1,
        flex:1,
        marginTop:1,
        height: 50,
    },
    input: {
        flex:Util.Parse.isChinese()?0:7,
        marginLeft:15,
        height: 50,
        fontSize:14
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 7,
        marginLeft:15,
        backgroundColor:'#fff',
        height:48
    },
    row2: {
        height: 50,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        marginTop:1
    },
    textsy:{
        color:Theme.commonFontColor,
        fontSize:14
    },
    shouquanstyle:{
        paddingHorizontal:10,
        paddingVertical:4,
        borderRadius:4,
        borderWidth:1,
        borderColor:Theme.theme
    }
})
