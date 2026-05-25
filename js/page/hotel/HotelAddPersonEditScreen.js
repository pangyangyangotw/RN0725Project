import React from 'react';
import {
    View, TouchableHighlight, StyleSheet
} from 'react-native';
import SuperView from '../../super/SuperView';
import ViewUtil from '../../util/ViewUtil';
import Util from '../../util/Util';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import I18nUtil from '../../util/I18nUtil';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CommonService from '../../service/CommonService';
import GlobalStyles from '../../res/styles/GlobalStyles';
import HighLight from '../../custom/HighLight';
import { Bt_inputView, InfoDicView, SelectView,No_inputView }  from '../../custom/HighLight';
import CustomeTextInput from '../../custom/CustomTextInput';

// let textInput = React.createRef();
export default class HotelAddPersonEditScreen extends SuperView {
    constructor(props) {
        super(props);
        this._enNameToastTs = 0;
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.passenger = Util.Encryption.clone(this.params.passenger || { SexDesc: '男', Sex: 1 ,CertificateType:'身份证'});
        this._navigationHeaderView = {
            title:'编辑乘客',
        }
        this.state = {
            select:false,
            selectCn:this.passenger.selectCn?this.passenger.selectCn:false
        }
    }

    _finishBtnClick = () => {
        const { passenger } = this;
        const {intlHotel,VendorCodeTVP} = this.params;
        const {select} = this.state;
        let showName =  (passenger.NationalCode == 'CN' || passenger.NationalCode == 'HK' || passenger.NationalCode == 'MO' || passenger.NationalCode == 'TW')
        if ((VendorCodeTVP || intlHotel ||((!select && !showName) || (select && showName))) && !passenger.LastName && !passenger.Surname ) {
            this.toastMsg('英文姓不能为空');
            return;
        }
        if(passenger.Surname || passenger.LastName){
            if(Util.RegEx.isEnName(passenger.Surname) || Util.RegEx.isEnName(passenger.LastName)){
                this.toastMsg('英文姓只能输入字母');
                return
            }
        }
        if ((VendorCodeTVP || intlHotel ||((!select && !showName) || (select && showName))) && !passenger.FirstName && !passenger.GivenName) {
            this.toastMsg('英文名不能为空');
            return;
        }
        if(passenger.GivenName || passenger.FirstName){
            if(Util.RegEx.isEnName(passenger.GivenName ) || Util.RegEx.isEnName(passenger.FirstName)){
                this.toastMsg('英文名只能输入字母');
                return
            }
        }
        if(VendorCodeTVP || intlHotel){
            passenger.Name = passenger.LastName +'/'+ passenger.FirstName;
        }
        if (!passenger.Name && !(VendorCodeTVP || intlHotel) && ((!select && showName) || (select && !showName))) {
            this.toastMsg('姓名不能为空');
            return;
        }
        if((!select && !showName) || (select && showName)){
            if(passenger.FirstName && passenger.LastName){
                passenger.Name = passenger.FirstName + '/' + passenger.LastName
            }else if(passenger.GivenName && passenger.Surname){
                passenger.Name = passenger.GivenName + '/' + passenger.Surname
            }
            passenger.selectCn = false
        }else{
            passenger.selectCn = true
        }
        if(!passenger.NationalName || !passenger.NationalCode){
            this.toastMsg('请选择国籍/地区');
            return;
        }
        if(!passenger.Mobile){
            this.toastMsg('手机号不能为空');
            return;
        }else if (!Util.RegEx.isMobile(passenger.Mobile)) {
            this.toastMsg('手机号格式不正确');
            return;
        } 
        // if(!passenger.Email && customerInfo.EmailRequired){
        //     this.toastMsg('邮箱不能为空');
        //     return;
        // }
        // if (passenger.Email && !Util.RegEx.isEmail(passenger.Email)) {
        //     this.toastMsg('请输入正确的邮箱格式');
        //     return;
        // }
        this.params.callBack(passenger);
        this.pop();
        
    }
    componentDidMount() {

    }

    _alertTip = () => {
        this.showAlertView(Util.Parse.isChinese() ? trainNameNotice : trainNameEnNotice);
    }

    renderBody() {
        const { index,IsNeedIDCard, customerInfo ,noComp,IsRewardPointTVP,VendorCodeTVP,intlHotel} = this.params;//IsNeedIDCard判断酒店是否需要证件信息
        const { passenger } = this;
        const { isEditSerinumber ,isEditMobile,SerialNumber,AdditionIfo,CardTravel,select} = this.state;
        // let showName =  (passenger.NationalCode == 'CN' || passenger.NationalCode == 'HK' || passenger.NationalCode == 'MO' || passenger.NationalCode == 'TW' )//国籍和中英文名联动
        let showName = true//默认显示中文名
        return (
            <View style={{flex:1}}>
            {
                ViewUtil.getNameTips()
            }
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" style={GlobalStyles.keyViewSy} showsVerticalScrollIndicator={false}>
                {/* {(VendorCodeTVP || intlHotel)  ? null :
                    <Bt_inputView dicKey={'姓名'} 
                                required={true}
                                bt_text={passenger.Name} 
                                _placeholder={'证件上的真实姓名'} 
                                _haveInfoAler={true}
                                _clickOnpress={()=>{
                                    this._alertTip()
                                }}
                                _callBack={(text)=>{
                                    passenger.Name = text; 
                                    this.setState({})
                                }}
                    />
                } */}
                {
                     !VendorCodeTVP && !intlHotel && ((!select && !showName) || (select && showName))?
                        <View>
                            <View style={[styles.row,{paddingHorizontal:1,height:50}]}>
                                <View style={{flexDirection:'column' ,flex:3}}>
                                    <HighLight name='姓（拼音）' style={{fontSize:14,color:Theme.commonFontColor}}/>
                                    <CustomText text='Surname' />
                                </View>
                                <CustomeTextInput style={styles.input} placeholder={'须与登机证件姓一致'} value={passenger.LastName || passenger.Surname} onChangeText={text => {
                                    const next = (text || '').replace(/[^a-zA-Z'\s]/g, '');
                                    if (text !== next) {
                                        const now = Date.now();
                                        if (now - this._enNameToastTs > 800) {
                                            this._enNameToastTs = now;
                                            this.toastMsg('英文姓只能输入字母');
                                        }
                                    }
                                    passenger.LastName = next;
                                    passenger.Surname = next;
                                    this.setState({});
                                }} />
                                    {
                                        (!select && !showName) || (select && showName)?
                                            <TouchableHighlight underlayColor='transparent' onPress={() => {this.setState({select:!select})}}>
                                                <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                                    <View style={{ backgroundColor: Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }}>
                                                        <CustomText text='中' style={{ color: Theme.commonFontColor}} />
                                                    </View>
                                                    <View style={{ backgroundColor: Theme.theme, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopRightRadius: 3, borderBottomRightRadius: 3 }}>
                                                        <CustomText text='EN' style={{ color: '#fff' }} />
                                                    </View>
                                                </View>
                                            </TouchableHighlight>
                                        :null
                                    }
                            </View>
                            <View style={[styles.row,{paddingHorizontal:1,height:50}]}>
                                <View style={{flexDirection:'column' ,flex:3}}>
                                    <HighLight name='名（拼音）' style={{fontSize:14,color:Theme.commonFontColor}} />
                                    <CustomText text='Given name' />
                                </View>
                                <CustomeTextInput style={[styles.input,{flex:7}]} value={passenger.FirstName || passenger.GivenName} placeholder={'须与登机证件名一致'} onChangeText={text => {
                                    const next = (text || '').replace(/[^a-zA-Z'\s]/g, '');
                                    if (text !== next) {
                                        const now = Date.now();
                                        if (now - this._enNameToastTs > 800) {
                                            this._enNameToastTs = now;
                                            this.toastMsg('英文名只能输入字母');
                                        }
                                    }
                                    passenger.FirstName = next;
                                    passenger.GivenName = next;
                                    this.setState({});
                                }} />
                            </View>
                        </View>
                    :null
                }
                { !VendorCodeTVP && ((!select && showName) || (select && !showName)) && !intlHotel?
                    <View style={[styles.row,{borderBottomColor:passenger.Name? Theme.lineColor:Theme.redColor,paddingHorizontal:1}]}>
                        <HighLight  name={'姓名'} value={passenger.Name} style={{color:Theme.commonFontColor, fontSize:14}}/>
                        <CustomeTextInput style={{ flex: 5,marginLeft:15 }} value={passenger.Name} onChangeText={text => { passenger.Name = text; this.setState({}) }} placeholder='须与登机证件姓名一致' />
                        {
                            VendorCodeTVP?null:
                            <TouchableHighlight underlayColor='transparent' onPress={() => {this.setState({select:!select})}}>
                                <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                    <View style={{ backgroundColor: Theme.theme, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }}>
                                        <CustomText text='中' style={{ color:'#fff'}} />
                                    </View>
                                    <View style={{ backgroundColor: Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopRightRadius: 3, borderBottomRightRadius: 3 }}>
                                        <CustomText text='EN' style={{ color:Theme.commonFontColor}} />
                                    </View>
                                </View>
                            </TouchableHighlight>
                        }
                    </View>
                    :null
                }
                {(VendorCodeTVP || intlHotel)?
                    <View>
                    {
                        <Bt_inputView dicKey={'英文姓'}
                                    required={true} 
                                    bt_text={passenger.LastName|| passenger.Surname} 
                                    _placeholder={Util.Parse.isChinese()?'姓氏':'LastName'} 
                                    warm_text={'需与证件一致'} 
                                    _callBack={(text)=>{
                                        passenger.LastName = text;
                                        passenger.Surname = text;
                                        this.setState({});
                                    }}
                                    isEnName={true}
                        />
                    }
                    {
                        <Bt_inputView dicKey={'英文名'}
                                    required={true} 
                                    bt_text={passenger.FirstName || passenger.GivenName} 
                                    _placeholder={Util.Parse.isChinese()?'名':'FirstName'} 
                                    warm_text={'需与证件一致'} 
                                    _callBack={(text)=>{
                                            passenger.FirstName = text;
                                            passenger.GivenName = text;
                                            this.setState({});
                                    }}
                                    isEnName={true}
                        />
                    }
                    </View>:null
                }
                <SelectView titleName={'国籍/地区'}
                            required={true}
                            _selectName={passenger.NationalCode&&passenger.NationalName ? passenger.NationalName:''}
                            _placeholder={'请选择国籍/地区'} 
                            _callBack={()=>{
                                this.push('NationalCity', {
                                    refresh: (item) => {
                                        this.passenger.NationalCode = item.Code;
                                        this.passenger.NationalName = item.Name;
                                        this.passenger.Nationality = item.Name;
                                        this.setState({
                                            // select:(item.Code==='CN'||item.Code==='HK'||item.Code==='MO'||item.Code==='TW') ? false :select
                                        });
                                    },
                                });
                            }}
                />
                {/* <Bt_inputView dicKey={'E-mail'} 
                                bt_text={passenger.Email} 
                                _placeholder={'邮箱(必填)'} 
                                _callBack={(text)=>{
                                        passenger.Email = text; 
                                        this.setState({}) 
                                }}
                                required={false}
                /> */}
                <Bt_inputView dicKey={'手机号'}
                                required={true} 
                                bt_text={isEditMobile?passenger.Mobile:passenger.Mobile&&passenger.Mobile.replace(/(\d{3})(\d{4})(\d{4})/,"$1****$3")} 
                                _placeholder={'手机号'} 
                                _onFocus={()=>{
                                    passenger.Mobile = '';
                                    this.setState({ isEditMobile: true })
                                }}
                                _onBlur={()=>{
                                    this.setState({ isEditMobile: false })
                                }}
                                keyboardType='numeric' 
                                _callBack={(text)=>{
                                    passenger.Mobile = text;
                                    passenger.Phone = text;
                                    this.setState({});
                                }}
                />
            </KeyboardAwareScrollView>
            {
               ViewUtil.getThemeButton('完成', this._finishBtnClick)
            }
            </View>
        )
    }
}
const styles = StyleSheet.create({

    row: {
        flexDirection: 'row',
        height: 40,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 10
    }
    , right: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 7,
    },
    rowRight: {
        flex: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    input: {
        flex: 6,
        marginLeft:15
    },
})
const trainNameNotice = `
乘客姓名填写说明：

1、确认姓名中生僻字无法输入时，可用生僻字拼音或同音字替代。
2、输入姓名保存后，遇有系统无法正确显示的汉字，可用该汉字的拼音或同音字重新修改后保存。
3、姓名中有繁体字无法输入时，可用简体替代。
4、姓名较长，汉字与英文字符合计超过30个（1个汉字算2个字符）的，需按姓名中第一个汉字或英文字符开始按顺序连续输入30个字符（空格字符不输入），其中英文字符输入时不区别大小写。
5、姓名中有“.”或“• ”时，请仔细辨析身份证件原件上的“.”或“• ”，准确输入。
6、姓名中有“,”时，请使用空格替换`;
const trainNameEnNotice = `Instructions for filling out the passenger's name:

1. The passenger's name and ID number must match the name and number on the card used when riding. If there is a Chinese name, please fill in the Chinese name.
2. If the name contains a rare word, you can directly input the pinyin instead. For example: "Wang Hao" can be entered as "Wang Yan".
3. Enter a maximum of 30 characters (1 Chinese character is 2 characters). If it exceeds 30 characters, please input 30 characters in sequence according to the first Chinese character or English character in the name. enter).
4. When there is "." or "?" in the name, please carefully discriminate the "." or "?" on the original ID card and input it accurately.`;
