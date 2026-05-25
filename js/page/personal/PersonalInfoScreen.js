import React from 'react';
import {
    View,
    Image,
    StyleSheet,
    TouchableHighlight,
    TouchableOpacity,
} from 'react-native';
import SuperView from '../../super/SuperView';
import ViewUtil from '../../util/ViewUtil';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomText from '../../custom/CustomText';
import CustomeTextInput from '../../custom/CustomTextInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Theme from '../../res/styles/Theme';

import Util from '../../util/Util';
import CustomActioSheet from '../../custom/CustomActionSheet';
import PickerHelper from '../../common/PickerHelper';
import CommonService from '../../service/CommonService';
import UserInfoUtil from '../../util/UserInfoUtil';
import TextView from '../ComprehensiveOrder/View/TextView';
import FlightSeatList from '../../res/js/flightSeatList';
import HighLight from '../../custom/HighLight';
import GlobalStyles from '../../res/styles/GlobalStyles';
import { Bt_inputView, InfoDicView, SelectView,No_inputView }  from '../../custom/HighLight';
import {TitleView2} from '../../custom/HighLight';

import I18nUtil from '../../util/I18nUtil';

export default class PersonalInfoScreen extends SuperView {
    constructor(props) {
        super(props);
        this._navigationHeaderView = {
            title: "个人信息",
            // rightButton: ViewUtil.getRightButton('完成', this._finishBtnClick),
        }
        this.state = {
            isEditSerinumber: false,
            passenger: null,
            options: ['身份证', '护照', '台湾居民来往大陆通行证', '台湾通行证', '港澳通行证', '港澳居民来往内地通行证', '港澳台居民居住证', '外国人永久居留身份证'],
            GenderOptions:['男','女'],
            isEditMobile:false,
            mealOptions: [],
            seatOPtions: [],
            MealPref:null,
            SeatPref:null,
            customerInfo:{},
            AdditionIfo:null,
            FlightMealList:[], 
            addApproveAgentList:[],          
        }
    }
    componentWillUnmount() {
        super.componentWillUnmount();
        PickerHelper.hide();
    }
    componentDidMount() {
        this.showLoadingView();
        CommonService.getUserInfo().then(response => {
            this.hideLoadingView();
            let AdditionIfo = response?.data?.Addition? 
            {
                ...response.data.Addition,
                DictItemList: response?.data?.Addition?.DictItemList ? response.data.Addition.DictItemList : []
            } 
            : 
            {
                DictItemList: []
            }
            if (response && response.success) {
                let obj = response.data;
                if (obj?.CertificateList) {
                    let Certificate = obj.CertificateList[0];
                    if(Certificate){
                        if(Certificate.Expire === "Invalid date"){Certificate.Expire=''}
                        obj.CertificateNumber = Certificate.SerialNumber;
                        obj.CertificateType = Certificate.TypeDesc;
                        obj.NationalName = Certificate.NationalName;
                        obj.NationalCode = Certificate.NationalCode;
                        obj.Nationality = Certificate.NationalName;
                        obj.NationalityCode = Certificate.NationalCode;
                        obj.IssueNationName = Certificate.IssueNationName;
                        obj.IssueNationCode = Certificate.IssueNationCode;
                        obj.CertificateExpire = Certificate.Expire;
                    }
                }
                if(!obj.Preference || !obj.Preference.FlightFavor){
                    if(!obj.Preference){
                        obj.Preference = {
                            FlightFavor:{
                                SeatPrefCode:"",
                                MealPrefCode:"",
                            }
                        }
                    }
                    obj.Preference.FlightFavor = {
                        SeatPrefCode:"",
                        MealPrefCode:"",
                    }
                }                
                CommonService.customerInfo().then(customerResponse => {
                    if (customerResponse && customerResponse.success) {
                        this.setState({
                            customerInfo:customerResponse.data,
                            AdditionIfo:AdditionIfo,
                        },()=>{
                            this._getMealData();
                        })
                    } else {
                        this.hideLoadingView();
                        this.toastMsg(customerResponse.message);
                    }
                }).catch(error => {
                    this.hideLoadingView();
                    this.toastMsg(error.message);
                })
                let seatList = [];
                FlightSeatList.forEach((item, i) => {
                    if(item.Code ===  obj.Preference.FlightFavor.SeatPrefCode){
                        this.setState({
                            SeatPref:item
                        })
                    }
                    if(Util.Parse.isChinese()){
                        seatList.push(item.Name);
                    }else{
                        seatList.push(item.EnName);
                    }
                })
                let AgentList = [];
                obj.AuthorizedApprovePerson.map((item, i) => {
                   if(item.Id && item.Id != 0){
                     AgentList.push(item);
                   }
                })
                this.setState({
                    passenger: obj,
                    seatOPtions: seatList,
                    // addApproveAgentList:obj.AuthorizedApprovePerson,
                    addApproveAgentList:AgentList,
                })

            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    _getMealData = () => {
        const {passenger} = this.state;
        if(!passenger){return};
        let mealList = [];
        let model = {
            Key:"flightMealPref|flightSeatPref"
        }
        CommonService.GetMelaData(model).then(response => {
            if (response && response.success && response.data) {
                response.data.flightMealPref?.forEach((item, i) => {
                    if(item.Code ===  passenger?.Preference?.FlightFavor?.MealPrefCode){
                        this.setState({
                            MealPref:item
                        })
                    }
                    if(Util.Parse.isChinese()){
                        mealList.push(item.Name);
                    }else{
                        mealList.push(item.EnName);
                    }
                })
                this.setState({
                    mealOptions: mealList,
                    FlightMealList:response.data.flightMealPref
                })
               
            } else {
                this.toastMsg(response.message);
            }
        }).catch(error => {
            this.toastMsg(error.message);
        })
    }

    _pickerShow = () => {
        PickerHelper.create(PickerHelper.createYYYYMMDDDate(), null, (data) => {
            this.state.passenger.Birthday = data.join('-');
            this.setState({});
        })
    }
    _pickerExpire = () => {

        PickerHelper.create(PickerHelper.createYYYYMMDDDate(), new Date(), (data) => {
            this.state.passenger.CertificateExpire = data.join('-');
            this.state.passenger.Expire = data.join('-');
            this.setState({});
        })
    }
    _finishBtnClick = () => {
        const { passenger,customerInfo,AdditionIfo } = this.state;
        if(this.state.AdditionIfo){
            passenger.Addition = this.state.AdditionIfo;
        }
        if (!passenger) {
            this.toastMsg('获取乘客信息失败');
            return;
        }
        // 添加手机号格式校验
        const mobileRegex = /^1[3-9]\d{9}$/;
        if (!mobileRegex.test(passenger.Mobile)) {
            this.toastMsg('请输入正确的手机号');
            return;
        }
        // if (!passenger.FirstName) {
        //     this.toastMsg('请填写英文姓');
        //     return;
        // }
        // if (!passenger.LastName) {
        //     this.toastMsg('请填写英文名');
        //     return;
        // }
        if (!passenger.NationalName) {
            this.toastMsg('请选择国籍/地区');
            return;
        }
        // if (!passenger.IssueNationName) {
        //     this.toastMsg('请选择证件签发国');
        //     return;
        // }
        if (!passenger.CertificateNumber) {
            this.toastMsg('请填写证件号码');
            return;
        }
        if ( !(passenger.CertificateType=='身份证'||passenger.CertificateType=="Chinese ID Card") && !passenger.CertificateExpire ) {
            this.toastMsg('请选择证件有效期');
            return;
        } else if(passenger.CertificateExpire) {
            // let now = new Date();
            // if (Util.Date.toDate(passenger.CertificateExpire) < now.setMonth(now.getMonth() + 6)) {
            //     this.toastMsg('证件有效期不足半年');
            //     return;
            // }
            // if (Util.Date.toDate(passenger.CertificateExpire) > now.setMonth(now.getMonth() + 120)) {
            //     this.toastMsg('证件有效期大于10年');
            //     return;
            // }
            
            // if (!passenger.CertificateExpire.includes('T')) {
            //     passenger.CertificateExpire += 'T00:00:00';
            // }
        }
        if (!passenger.Birthday) {
            this.toastMsg('出生日期不能为空');
            return;
        }
        if (passenger.Birthday && !passenger.Birthday.includes('T') && Util.Parse.isChinese()) {
            passenger.Birthday += 'T00:00:00';
        }
        if (!passenger.SexDesc && (passenger.Sex !=1) && (passenger.Sex !=2)) {
            this.toastMsg('请选择性别');
            return;
        }
        if (!passenger.CertificateType) {
            this.toastMsg('请选择证件类型');
            return;
        } else {
            let index = passenger?.CertificateList?.findIndex(obj => Util.Read.certificateType(passenger?.CertificateType) === obj.Type);
            let certiface = {
                SerialNumber : passenger.CertificateNumber,
                Type : Util.Read.certificateType(passenger.CertificateType),
                Expire : passenger.CertificateExpire,
                NationalCode : passenger.NationalCode,
                 NationalName : passenger.NationalName,
                 IssueNationCode : passenger.IssueNationCode,
                 IssueNationName : passenger.IssueNationName,
                Birthday : passenger.Birthday,
                Sex : passenger.SexDesc === '男' ? 1 : 2
            }
            if (index > -1) {
                passenger.CertificateList[index] = certiface;
            }else{
                passenger.CertificateList.push(certiface);
            }
            passenger.Certificate = JSON.stringify(passenger.CertificateList);
        }
        let obj = {};
        passenger.CertificateList = passenger.CertificateList.reduce((cur,next)=>{
              obj[next.Type] ? "" : obj[next.Type] = true && cur.push(next);
              return cur;
        },[]);
        passenger.Certificate = JSON.stringify(passenger.CertificateList);

        if (customerInfo.EmployeeDictList) {
            for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                const obj = customerInfo.EmployeeDictList[i];
                let dicItem = passenger.Addition.DictItemList&&passenger.Addition.DictItemList.find(dic => dic.DictId === obj.Id);
                if (obj.IsRequire) {
                    // if (userInfo && userInfo.Customer.Id === Customer.DRHJ && obj.Name === '实施阶段') {
                    //     continue;
                    // }
                    if (!dicItem) {
                        this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                        return;
                    } else {
                        if (obj.NeedInput && !dicItem.ItemName) {
                            this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                            return;
                        } else if(obj.NeedInput && dicItem.ItemName && obj.FormatRegexp){//正则提示
                                let regex=new RegExp(obj.FormatRegexp)
                                if(!regex.test(dicItem.ItemName)){
                                    this.toastMsg(obj.Remark);
                                    return;
                                }
                        }
                        else if (!obj.NeedInput && !dicItem.ItemId) {
                            this.toastMsg(I18nUtil.tranlateInsert('{{noun}}不能为空', I18nUtil.translate(obj.Name)));
                            return;
                        }
                    }
                }else if(obj.NeedInput && (dicItem&&dicItem.ItemName) && obj.FormatRegexp){
                    let regex=new RegExp(obj.FormatRegexp)
                    if(!regex.test(dicItem.ItemName)){
                        this.toastMsg(I18nUtil.tranlateInsert('{{noun}}格式不符合规则', I18nUtil.translate(Util.Parse.isChinese()?dicItem.DictName:dicItem.DictEnName)));
                        return;
                    }
                }

            }
        }
        passenger.CertificateList.map((item)=>{
            if(item.TypeDesc==passenger.CertificateType){
                item.IssueNationCode = passenger.IssueNationCode
                item.IssueNationName = passenger.IssueNationName
                item.SerialNumber = passenger.CertificateNumber
                item.Expire = passenger.CertificateExpire
            }
        })
        this.showLoadingView();
        CommonService.CurrentUserEmployeeEdit(passenger).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.showAlertView('编辑个人信息成功', () => {
                    return ViewUtil.getAlertButton('确定', () => {
                        this.dismissAlertView();
                        this.pop();
                    })
                })
            } else {
                this.toastMsg(response.message || '编辑个人信息失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '编辑个人信息异常');
        })
    }
    _handlePress = (index) => {
        const { options, passenger } = this.state;
        if (passenger.CertificateType !== options[index]) {
            passenger.CertificateType = options[index];
            passenger.CertificateNumber = '';
            passenger.Expire = '';
            passenger.IssueNationName = '';
            passenger.IssueNationCode = '';
            passenger.CertificateExpire = '';
            if (passenger.Certificate) {
                let CertificateList = JSON.parse(passenger.Certificate) || [];
                let Type = Util.Read.certificateType2(passenger.CertificateType)
                let obj = CertificateList.find(item => item.Type == Type );
                if (obj) {
                    passenger.CertificateNumber = obj.SerialNumber;
                    passenger.Expire = obj.Expire;
                    passenger.IssueNationName = obj.IssueNationName;
                    passenger.IssueNationCode = obj.IssueNationCode;
                    passenger.CertificateExpire = obj.Expire;
                }
            }
        }

        this.setState({});
    }

    _addMassegeText=()=>{
        const { customerInfo,AdditionIfo } = this.state;
        return( 
        <View  style={{backgroundColor:'#fff', marginTop:10}}>
        {
            customerInfo?.EmployeeDictList?.length > 0 ?
            customerInfo.EmployeeDictList?.map((obj, index) => {
                let itemIndex;
                itemIndex = AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(
                    item => item.DictId === obj.Id
                );
                if(!itemIndex){
                    itemIndex = obj
                    itemIndex.DictName =Util.Parse.isChinese()? obj.Name:obj.EnName
                }
                let remark = Util.Parse.isChinese()? obj.Remark:obj.EnRemark
                return (
                    itemIndex?
                            <InfoDicView index={index} 
                                                 obj={obj} 
                                                 itemIndex={itemIndex} 
                                                 value_Change={(text)=>{
                                                     this._valueCHange(text, obj);
                                                 }}
                                                 select_DicList={()=>{
                                                      this._toSelectDicList(obj)
                                                 }}
                            />:null
                //    itemIndex?
                //     <View key={index} style={styles.row}>
                //         {obj.IsRequire?<HighLight name={Util.Parse.isChinese()? itemIndex.DictName:obj.EnName} />:<CustomText text={Util.Parse.isChinese()?obj.Name:obj.EnName} style={{ flex: 3 }} />}
                //         {
                //             <View style={{backgroundColor:obj.IsRequire&& !(itemIndex && itemIndex.ItemName)?'#F7CCD1':'#fff',height:38,flex: 7,justifyContent:'center'}}>
                //                 <CustomeTextInput style={{ flex: 7 }} 
                //                                   value={itemIndex && itemIndex.ItemName} 
                //                                   placeholder={remark} 
                //                                   editable={itemIndex.IsEditInput} 
                //                                   onChangeText={(text) => {
                //                                         this._valueCHange(text, obj);
                //                                   }} />
                //             </View>
                //         }
                //     </View>
                //    :null
                )
            })
            : null
       }
       </View>
       )
    }
    _valueCHange = (text, obj) => {
        const { AdditionIfo } = this.state;
        let itemIndex = AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
        if (itemIndex) {
            itemIndex.ItemName = text;
        } else {
            let model = {
                DictId: obj.Id,
                DictName: obj.Name,
                ItemId: '',
                ItemSerialNumber: '',
                ItemName: text,
                FormatRegexp:obj.FormatRegexp,
                Remark:obj.Remark,
                EnName:obj.EnName,
                RemarkNo:obj.RemarkNo
            }
            AdditionIfo.DictItemList.push(model);
        }
        this.setState({});
    }
    _toSelectDicList = (obj) => {
        const { AdditionIfo } = this.state;
        this.push('DicList', {
            title: obj.Name,
            Id: obj.Id,
            callBack: (data) => {
                let dic = AdditionIfo&&AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
                if (dic) {
                    dic.ItemId = data.Id;
                    dic.ItemSerialNumber = data.SerialNumber;
                    dic.ItemInput = `${data.SerialNumber} - ${data.Name} - ${data.EnName}`;
                    dic.ItemName = data.Name;
                    dic.EnName = data.EnName,
                    dic.DictCode = obj.Code
                    dic.NeedInput = obj.NeedInput
                } else {
                    let model = {
                        DictId: obj.Id,
                        DictName: obj.Name,
                        ItemId: data.Id,
                        ItemSerialNumber: data.SerialNumber,
                        ItemInput: `${data.SerialNumber} - ${data.Name} - ${data.EnName}`,
                        ItemName: data.Name,
                        FormatRegexp:obj.FormatRegexp,
                        EnName:data.EnName,
                        RemarkNo:obj.RemarkNo,
                        DictCode: obj.Code,
                        NeedInput:obj.NeedInput
                    }
                    AdditionIfo&&AdditionIfo.DictItemList.push(model);
                }
                this.setState({});

            }
        })
    }

    _CardTravel = () => {
        const { passenger } = this.state;
        return(
            <View style={{backgroundColor:'#fff', marginTop:10}}>
                <SelectView titleName={'航空常客卡'}
                                        required={false}
                                        _clickOnpress={()=>{
                                            this._showCardTravel1()
                                        }}
                                        _haveInfoAler={true} 
                                        _callBack={()=>{
                                            this.push("FlightCard",{CardTravellerList:passenger.CardTravellerList})
                                        }}
                />
                <SelectView titleName={'酒店常客卡'}
                                        required={false}
                                        _clickOnpress={()=>{
                                            this._showCardTravel1()
                                        }}
                                        _haveInfoAler={true} 
                                        _callBack={()=>{
                                            this.push("HotelCardScreen",{HotelCardTravellerList:passenger.HotelCardTravellerList})
                                        }}
                />
            </View>
        )
    }

    _flightFavor=()=>{
        const { MealPref,SeatPref } = this.state;
        return(
            <View style={{backgroundColor:'#fff', marginTop:10}}>
                <SelectView titleName={'航空座位偏好'}
                                        required={false}
                                        _clickOnpress={()=>{
                                            this._showInsurece1()
                                        }}
                                        _haveInfoAler={true}
                                        _selectName={ Util.Parse.isChinese() ? SeatPref&&SeatPref.Name : SeatPref&&SeatPref.EnName } 
                                        _callBack={()=>{
                                            this.seatActionSheet.show();
                                        }}
                />
                <SelectView titleName={'航空餐食偏好'}
                                        required={false}
                                        _clickOnpress={()=>{
                                            this._showInsurece2()
                                        }}
                                        _haveInfoAler={true}
                                        _selectName={ Util.Parse.isChinese() ? MealPref&&MealPref.Name : MealPref&&MealPref.EnName } 
                                        _callBack={()=>{
                                            this.mealActionSheet.show();
                                        }}
                />
            </View>
        )
    }

    _showInsurece1 = () => {
        let text = "1. 您的座位偏好可在航空预定时向航司申请, 由于航班或者航司原因可能会申请失败. \n2. 部分航司不支持在线座位偏好申请. \n3. 最终航班座位的确认以在值机时与航司确认的结果为准."
        let textEn = "1. Your seat preference will be applied to the airline at the time of the booking, due to the flight or airline reasons the application may not be confirmed.\n2. Some airlines do not support seat preferences by online requests.\n3. The final confirmation of the seat preference is subject to the result confirmed with the Airline at check-in."
        this.showAlertView(Util.Parse.isChinese()?text:textEn);
    }
    _showInsurece2 = () => {
        let text = "1. 您的特殊餐食偏好可在航空预定时向航司申请, 由于航班或者航司原因可能会申请失败. \n2. 部分航司不支持特殊餐食偏好申请. \n3. 最终特殊餐食申请的确认以在值机时与航司确认的结果为准."
        let textEn = "1. Your meal preference will be applied to the airline at the time of the booking, due to the flight or airline reasons the application may not be confirmed.\n2. Some airlines do not support meal preferences by online requests. \n3. The final confirmation of the meal preference is subject to the result confirmed with the Airline at check-in."
        this.showAlertView(Util.Parse.isChinese()?text:textEn);
    }
    _showCardTravel1 = () => {
        let text = "1. 个人中心维护的常客卡信息在预定时会传输给可接收的供应商。\n2. 请维护正确的常客卡信息，常客卡信息错误可能会导致预定失败。\n3. 部分酒店价格的供应商不支持常客卡积分。\n4. 部分航空公司（如廉航）可能不支持常客卡的传输。\n5. 请您在航空柜台或者酒店前台登记时与航司或者酒店确认常客卡是否可用于累积积分，最终以航司或酒店确认为准。."
        let textEn = "1. The membership cards maintained will be submitted to the available providers at the time of booking. \n2. Please maintain the correct membership cards. Incorrect membership numbers may result in booking failure. \n3. Some hotel rates may not be available for the membership rewards program. \n4. Some airlines (e.g., LCC) may not be capable to receive the frequent flyer number via the online booking channel.\n5. Please confirm with the airline or hotel whether the membership applies to the points accumulation when check-in. The final confirmation is subject to the airline or hotel."
        this.showAlertView(Util.Parse.isChinese()?text:textEn);
    }

    renderBody() {
        const { isEditSerinumber, isEditMobile,options, passenger,seatOPtions,mealOptions,addApproveAgentList,GenderOptions } = this.state;
        if (!passenger) return null;
        if (passenger.Birthday) {
            if (passenger.Birthday === '0001-01-01T00:00:00') {
                passenger.Birthday = '';
            } else {
                // passenger.Birthday = Util.Date.toDate(passenger.Birthday).format('yyyy-MM-dd');
                passenger.Birthday = passenger.Birthday.split('T')[0]
                passenger.Birthday = Util.Date.formatDate0(passenger.Birthday);
            }
        }
        if (passenger.CertificateExpire) {
            if (passenger.CertificateExpire === '0001-01-01T00:00:00'||passenger.CertificateExpire === 'Invalid dateT00:00:00') {
                passenger.CertificateExpire = '';
            } else {
                passenger.CertificateExpire = passenger.CertificateExpire.split('T')[0]
                passenger.CertificateExpire = Util.Date.formatDate0(passenger.CertificateExpire);
            }
        }
                        
        let soure = null;
        if (passenger.ImageUrl) {
            soure = {
                uri: passenger.ImageUrl
            }
        }
        return (
            <View style={{ flex:1}}>
            {
                ViewUtil.getNameTips()
            }
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={GlobalStyles.keyViewSy}>
                <Bt_inputView dicKey={'姓名'} 
                                  required={true}
                                  bt_text={passenger.Name} 
                                  _placeholder={'证件上的真实姓名'} 
                                  _callBack={(text)=>{
                                        passenger.Name = text;
                                        this.setState({});
                                  }}
                                  
                />
                <Bt_inputView dicKey={'公司'} 
                                  required={false}
                                  bt_text={passenger?.Customer?.Name ?? ' '} 
                                  _placeholder={''} 
                                  no_editable={true}
                />
                <Bt_inputView dicKey={'工作名'} 
                                  required={false}
                                  bt_text={passenger.WorkingNamee} 
                                  _callBack={(text)=>{
                                        passenger.WorkingName = text;
                                        this.setState({});
                                  }}
                />
                <Bt_inputView dicKey={'英文姓'}
                            required={false} 
                            bt_text={
                                passenger.LastName
                            } 
                            _placeholder={'姓氏'} 
                            warm_text={'需与证件一致'} 
                            _callBack={(text)=>{
                                passenger.LastName = text;
                                this.setState({});
                            }}
                            isEnName = {true}
                />
                <Bt_inputView dicKey={'英文名'}
                                  required={false} 
                                  bt_text={
                                    passenger.FirstName
                                  } 
                                  _placeholder={'名'} 
                                  warm_text={'需与证件一致'} 
                                  _callBack={(text)=>{
                                        passenger.FirstName = text;
                                        this.setState({});
                                  }}
                                  isEnName = {true}
                />
                <Bt_inputView dicKey={'手机号'}
                                  required={false} 
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
                                        this.setState({});
                                  }}
                />
                <SelectView titleName={'国籍/地区'}
                            required={true}
                            _selectName={passenger.NationalName}
                            _placeholder={'请选择国籍/地区'} 
                            _callBack={()=>{
                                this.push('NationalCity', {
                                    refresh: (item) => {
                                        passenger.NationalCode = item.Code;
                                        passenger.NationalName = item.Name;
                                        passenger.Nationality = item.Name;
                                        passenger.NationalityCode = item.Code;
                                        this.setState({});
                                    },
                                    CertificateType:passenger.CertificateType
                                });
                            }}
                />
                <SelectView titleName={'证件类型'}
                            required={false}
                            _selectName={passenger.CertificateType}
                            _placeholder={''} 
                            _callBack={()=>{
                            this.actionSheet.show();
                            }}
                />
                <Bt_inputView dicKey={'证件号码'}
                            required={true} 
                            bt_text={isEditSerinumber ? passenger.CertificateNumber : Util.Read.simpleReplace(passenger.CertificateNumber)} 
                            _placeholder={'证件号码(必填)'} 
                            _onFocus={()=>{
                                // passenger.CertificateNumber = '';
                                this.setState({ isEditSerinumber: true })
                            }}
                            _onBlur={()=>{
                                this.setState({ isEditSerinumber: false })
                            }}
                            _callBack={(text)=>{
                                if (this.state.isEditSerinumber) {
                                    passenger.CertificateNumber = text;
                                    this.setState({});
                                }
                            }}
                />
                {
                   (passenger.CertificateType == '身份证'|| passenger.CertificateType == 'Chinese ID Card')?null:
                   <SelectView titleName={'有效期至'}
                            required={true}
                            _selectName={passenger.CertificateExpire}
                            _placeholder={''} 
                            _callBack={()=>{
                                this._pickerExpire()
                            }}
                    />
                }
                <SelectView titleName={'证件签发国'}
                                required={false}
                                _selectName={passenger.IssueNationName}
                                _placeholder={'请选择'} 
                                _callBack={()=>{
                                    this.push('NationalCity', {
                                        refresh: (item) => {
                                            passenger.IssueNationCode = item.Code;
                                            passenger.IssueNationName = item.Name;
                                            this.setState({ });
                                        },
                                        // CertificateType:passenger.CertificateType
                                    });
                                }}
                />
                <SelectView titleName={'出生日期'}
                            required={true}
                            _selectName={passenger.Birthday}
                            _placeholder={'请选择出生日期'} 
                            _callBack={()=>{
                                this._pickerShow();
                            }}
                />
                <SelectView titleName={'性别'}
                            required={true}
                            _selectName={passenger.SexDesc}
                            _placeholder={'请选择性别'} 
                            _callBack={()=>{
                                this.GenderActionSheet.show();
                            }}
                />
                <Bt_inputView dicKey={'E-mail'} 
                            bt_text={passenger.Email} 
                            no_editable={true}
                            required={false}
                />
                {this._CardTravel()}
                {this._flightFavor()}
                <CustomActioSheet ref={o => this.actionSheet = o} options={options} onPress={this._handlePress} />
                <CustomActioSheet ref={o => this.seatActionSheet = o} options={seatOPtions} onPress={this._seatHandlePress} />
                <CustomActioSheet ref={o => this.mealActionSheet = o} options={mealOptions} cancelButtonText={'清空'} onPress={this._mealHandlePress} />
                <CustomActioSheet ref={o => this.GenderActionSheet = o} options={GenderOptions} onPress={this._genderHandlePress} />
                {this._addMassegeText()}
                <View style={{marginBottom:50}}></View>
            </KeyboardAwareScrollView>
            {
                 ViewUtil.getThemeButton('完成', this._finishBtnClick)
            }
            </View>
        )
    }

    _genderHandlePress=(index)=>{
        const { passenger } = this.state
        if (index === 1) {
            passenger.SexDesc = '女';
            passenger.Sex = 2;
        } else {
            passenger.SexDesc = '男';
            passenger.Sex = 1;
        }
        this.setState({});
    }

    _seatHandlePress=(index)=>{
        const { passenger } = this.state
        if(index != 'cancel'){
            passenger.Preference.FlightFavor.SeatPrefCode = FlightSeatList[index].Code
            this.setState({
                SeatPref: FlightSeatList[index]
            })
        }else{
            passenger.Preference.FlightFavor.SeatPrefCode = null
            this.setState({
                SeatPref: null
            })
        }
    }
    _mealHandlePress=(index)=>{
        const { passenger,FlightMealList } = this.state
        if(index != 'cancel'){
            passenger.Preference.FlightFavor.MealPrefCode = FlightMealList[index].Code
            this.setState({
                MealPref: FlightMealList[index]
            })
        }else{
            passenger.Preference.FlightFavor.MealPrefCode = null
            this.setState({
                MealPref: null
            })
        }
    }
}
const styles = StyleSheet.create({
    row: {
        height: 44,
        backgroundColor: 'white',
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 0.5
    },
    text: {
        flex: 3,
    },
    input: {
        flex: 7,
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 7,
    },
    shouquanrenItemStyle:{
        flexDirection:'row',
        justifyContent:'space-between',
        borderBottomWidth:1,
        height:50,
        alignItems:'center',
        borderColor:Theme.lineColor
    }
})