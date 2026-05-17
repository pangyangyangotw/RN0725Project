import React from 'react';
import {
    View,
    StyleSheet,
    DeviceEventEmitter,
    TouchableOpacity
} from 'react-native';
import SuperView from '../../super/SuperView';
import ViewUtil from '../../util/ViewUtil';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomText from '../../custom/CustomText';
import CustomeTextInput from '../../custom/CustomTextInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Theme from '../../res/styles/Theme';
import Util from '../../util/Util';
import CustomActioSheet from '../../custom/CustomActionSheet';
import PickerHelper from '../../common/PickerHelper';
import IntlFlightEnum from '../../enum/IntlFlightEnum';
import I18nUtil from '../../util/I18nUtil';
import ImagePicker from 'react-native-image-picker';
import RNFetchBlob from 'rn-fetch-blob';
import CommonService from '../../service/CommonService';
import HighLight  from '../../custom/HighLight';
import UserInfoDao from '../../service/UserInfoDao';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FlightSeatList from '../../res/js/flightSeatList';
import GlobalStyles from '../../res/styles/GlobalStyles';
import { Bt_inputView, InfoDicView, SelectView,No_inputView }  from '../../custom/HighLight';
 
export default class EditHandPassengerScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.passenger = Util.Encryption.clone(this.params.passenger || {  Gender: null, CertificateType : '护照' });
        this._navigationHeaderView = {
            title:this.params.title||"编辑信息",
            // rightButton: ViewUtil.getRightButton('完成', this._finishBtnClick)
        }
        let options = ['护照', '台湾通行证', '港澳通行证', '台湾居民来往大陆通行证', '港澳居民来往内地通行证', '港澳台居民居住证', '外国人永久居留身份证','大陆居民往来台湾通行证','外交部签发的驻华外交人员证','民航局规定的其他有效乘机身份证件'];
        if(this.params.from === 'presonal' ||this.params.from === 'em_presonal'){
            options.unshift("身份证");
        }
        let addition = typeof(this.passenger.Addition)=="string"? JSON.parse(this.passenger.Addition):this.passenger.Addition
        this.state = {
            isEditSerinumber: false,
            options: options,
            GenderOptions:['男','女'],
            isEditMobile:false,
             // 数据字典
             AdditionIfo: addition ? {
                ...addition,
                DictItemList: addition.DictItemList ? addition.DictItemList : []
            } : {
                    DictItemList: []
            },
            user_info:{},
            mealOptions: [],
            seatOPtions: [],
            MealPref:null,
            SeatPref:null,
            FlightMealList:[],
            customerInfo:{} ,
            addApproveAgentList:this.passenger.AuthorizedApprovePerson || [],          
          
        }
    }

    componentDidMount(){
        UserInfoDao.getUserInfo().then(response => {
            this.setState({
                user_info:response
            })
        }) 
        
        if (this.passenger.CertificateList) {
            let Certificate = this.passenger.CertificateList[0];
            if(Certificate){
                if(Certificate.Expire === "Invalid date"){Certificate.Expire=''}
                this.passenger.CertificateNumber = Certificate.SerialNumber;
                this.passenger.CertificateType = Certificate.TypeDesc;
                this.passenger.NationalName = Certificate.NationalName;
                this.passenger.NationalCode = Certificate.NationalCode;
                this.passenger.Nationality = Certificate.NationalName;
                this.passenger.IssueNationName = Certificate.IssueNationName;
                this.passenger.IssueNationCode = Certificate.IssueNationCode;
                this.passenger.CertificateExpire = Certificate.Expire;
            }
        }

        this._getSeat(); 
        let model={
            ReferenceEmployeeId:this.passenger.Id,
            ReferencePassengerId:this.passenger.Id,
        }
        CommonService.customerInfo(model).then(response => {
            if (response && response.success && response.data) { 
                this.setState({
                    customerInfo:response.data,
                })
            } 
        }).catch(error => {
            this.toastMsg(error.message);
        })       
    }

    _getSeat = () => {
        let seatList = [];
        FlightSeatList.forEach((item, i) => {
            if(this.passenger&&this.passenger.Preference&&this.passenger.Preference.FlightFavor&&this.passenger.Preference.FlightFavor.SeatPrefCode === item.Code ){
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
        this.setState({
            seatOPtions: seatList,
        },()=>{
            this._getMealData();
        })
    }

    _getMealData = () => {
        const {passenger} = this;
        if(!passenger){return};
        let mealList = [];
        let model = {
            Key:"flightMealPref|flightSeatPref"
        }
        CommonService.GetMelaData(model).then(response => {
            if (response && response.success && response.data) {
                response.data.flightMealPref&&response.data.flightMealPref.forEach((item, i) => {
                    if(passenger.Preference&&passenger.Preference.FlightFavor&&passenger.Preference.FlightFavor.MealPrefCode===item.Code){
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

    componentWillUnmount() {
        super.componentWillUnmount();
        PickerHelper.hide();
    }

    _pickerShow = () => {
        PickerHelper.create(PickerHelper.createYYYYMMDDDate(), null, (data) => {
            this.passenger.Birthday = data.join('-');
            this.setState({});
        })
    }

    _pickerExpire = () => {

        PickerHelper.create(PickerHelper.createYYYYMMDDDate(), new Date(), (data) => {
            this.passenger.CertificateExpire = data.join('-');
            this.setState({});
        })
    }

    _finishBtnClick = () => {
        const { passenger } = this;
        const { customerInfo} = this.state;
        if(this.state.AdditionIfo){
            passenger.Addition = this.state.AdditionIfo;
            passenger.AdditionInfo = this.state.AdditionIfo;
        }
        if (customerInfo&&customerInfo.EmployeeDictList) {
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
                        } else if(obj.NeedInput && dicItem.ItemName && obj.FormatRegexp){
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
        if (!passenger) {
            this.toastMsg('获取乘客信息失败');
            return;
        }
        if (!passenger.LastName) {
            this.toastMsg('请填写英文姓');
            return;
        }
        if (!passenger.FirstName) {
            this.toastMsg('请填写英文名');
            return;
        }
        if (!passenger.Name) {
            this.toastMsg('请填写姓名');
            return;
        }
        if(this.params.index ===1){//综合订单编辑员工时不显示成本中心
           
        }else if( customerInfo&&customerInfo.Setting&&customerInfo.Setting.MassOrderConfig.FrequentTravellerCostCenterMode===1){
            if((this.params.title=='新增乘客'||passenger.CostCenterRequired) && !passenger.CostCenter){
                this.toastMsg('请填写成本中心');
                return;
            }
        }
        if (!passenger.Mobile) {
            this.toastMsg('请填写手机号');
            return;
        }
        // 添加手机号格式校验
        const mobileRegex = /^1[3-9]\d{9}$/;
        if (!mobileRegex.test(passenger.Mobile)) {
            this.toastMsg('请输入正确的手机号');
            return;
        }
        if (!passenger.NationalName) {
            this.toastMsg('请选择国籍/地区');
            return;
        }
        if (!passenger.CertificateType) {
            this.toastMsg('请选择证件类型');
            return;
        }
        if (this.params.from !== 'presonal' && this.params.from !== 'em_presonal') {
            let isVaild = IntlFlightEnum.validCertificates.some(item => item.desc === passenger.CertificateType);
            if (!isVaild) {
                this.toastMsg('不支持该证件类型');
                return;
            }
        }
        if (!passenger.CertificateNumber) {
            this.toastMsg('请填写证件号码');
            return;
        }
        if (!passenger.CertificateExpire) {
             if(passenger.CertificateType != '身份证' && passenger.CertificateType != 'Chinese ID Card'){
                this.toastMsg('请选择证件有效期');
                return;
             }
        } else {
            let now = new Date();
            // if (Util.Date.toDate(passenger.CertificateExpire) < now.setMonth(now.getMonth() + 6)) {
            //     this.toastMsg('证件有效期不足半年');
            //     return;
            // }
            // if (Util.Date.toDate(passenger.CertificateExpire) > now.setMonth(now.getMonth() + 120)) {
            //     this.toastMsg('证件有效期大于10年');
            //     return;
            // }
            // if (passenger.CertificateExpire && !passenger.CertificateExpire.includes('T')) {
            //     passenger.CertificateExpire += 'T00:00:00';
            // }
        }
        if (!passenger.IssueNationName && !(passenger.CertificateType=='身份证'||passenger.CertificateType=="Chinese ID Card")) {
            this.toastMsg('请选择证件签发国');
            return;
        }
       

        if(!passenger.Email && customerInfo.EmailRequired){
            this.toastMsg('邮箱不能为空');
            return;
        }
        if (passenger.Email && !Util.RegEx.isEmail(passenger.Email)) {
            this.toastMsg('请输入正确的邮箱格式');
            return;
        }
        
        if (!passenger.Birthday) {
            this.toastMsg('出生日期不能为空');
            return;
        }
        if(!passenger.Sex && !passenger.Gender){
            this.toastMsg('请选择性别');
            return;
        }
        this.showLoadingView();
        passenger.CertificateList.map((item)=>{
            if(item.TypeDesc==passenger.CertificateType){
                item.IssueNationCode = passenger.IssueNationCode
                item.IssueNationName = passenger.IssueNationName
                item.SerialNumber = passenger.CertificateNumber
                item.Expire = passenger.CertificateExpire
            }
        })
        CommonService.CurrentUserEmployeeEdit(passenger).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                this.showAlertView('编辑个人信息成功', () => {
                    return ViewUtil.getAlertButton('确定', () => {
                        this.dismissAlertView();
                        DeviceEventEmitter.emit('refTravelerInfo',response);
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
        const { options } = this.state;
        if (this.passenger.CertificateType !== options[index]) {
            this.passenger.CertificateType = options[index];
            this.passenger.CertificateNumber = '';
            this.passenger.Expire = '';
            this.passenger.IssueNationName = '';
            this.passenger.IssueNationCode = '';
            this.passenger.CertificateExpire = '';
            if (this.passenger.Certificate) {
                let CertificateList = JSON.parse(this.passenger.Certificate) || [];
                let Type = Util.Read.certificateType2(this.passenger.CertificateType)
                let obj = CertificateList.find(item => item.Type == Type );
                if (obj) {
                    this.passenger.CertificateNumber = obj.SerialNumber;
                    this.passenger.Expire = obj.Expire;
                    this.passenger.IssueNationName = obj.IssueNationName;
                    this.passenger.IssueNationCode = obj.IssueNationCode;
                    this.passenger.CertificateExpire = obj.Expire;
                }
            }
        }
        this.setState({});
    }
    /**
     *  选择图片
     */
    _selectImage = () => {
        var options = {
            //底部弹出框选项
            title: I18nUtil.translate('请选择'),
            cancelButtonTitle: I18nUtil.translate('取消'),
            takePhotoButtonTitle: I18nUtil.translate('拍照'),
            chooseFromLibraryButtonTitle: I18nUtil.translate('选择相册'),
            quality: 0.75,
            allowsEditing: true,
            noData: false,
            storageOptions: {
                skipBackup: true,
                path: 'images'
            }
        }
        ImagePicker.showImagePicker(options, (response) => {
            if (response.didCancel) {
            } else if (response.error) {
            } else {

                this.passenger.ImageUrl = response.uri;
                this.setState({

                }, () => {
                    this._uploadImage();
                })

            }
        })
    }

    _uploadImage = () => {
        const { ImageUrl } = this.passenger;
        let url = null;
        if (ImageUrl.search('file://') > -1) {
            url = ImageUrl.slice(6);
        } else {
            url = ImageUrl;
        }
        let model = [{ name: 'avatar', filename: 'avatar.jpg', data: RNFetchBlob.wrap(url) }];
        this.showLoadingView('正在上传图片');
        CommonService.CertificateImageUpload(model).then(response => {
            this.hideLoadingView();
            if (response && response.success == 1) {
                this.passenger.ImageUrl = response.data;
                this.toastMsg('上传图片成功');
            } else {
                this.toastMsg(response.message || '图片上传失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '图片上传失败');
        })
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
        const { passenger } = this;
        const { customerInfo } = this.state;  
        const { isEditSerinumber, isEditMobile,options, AdditionIfo , user_info, seatOPtions, mealOptions,GenderOptions} = this.state;
        if (passenger.Birthday) {
            if (passenger.Birthday === '0001-01-01T00:00:00') {
                passenger.Birthday = '';
            } else {
                passenger.Birthday = Util.Date.toDate(passenger.Birthday).format('yyyy-MM-dd');
            }
        }
        if (passenger.CertificateExpire) {
            if (passenger.CertificateExpire === '0001-01-01T00:00:00'||passenger.CertificateExpire === 'Invalid dateT00:00:00') {
                passenger.CertificateExpire = '';
            } else {
                passenger.CertificateExpire = Util.Date.toDate(passenger.CertificateExpire).format('yyyy-MM-dd');
            }
        }
        let soure = null;
        if (passenger.ImageUrl) {
            soure = {
                uri: passenger.ImageUrl
            }
        }
        if(passenger.CertificateNumber&& !passenger.Birthday){
            let str ;
            function insertStr(soure, start, newStr){   
                return soure.slice(0, start) + newStr + soure.slice(start);
             }
            if(passenger.CertificateNumber.length==18){
                passenger.CertificateNumber.slice(7,13)
                str= passenger.CertificateNumber.slice(6,14)
                str= insertStr(str,4,"-");
                str= insertStr(str,7,"-");
                str = str +'T00:00:00'
                passenger.Birthday = Util.Date.toDate(str).format('yyyy-MM-dd');
            }
        }
        let costCenter = customerInfo&&customerInfo.Setting&&customerInfo.Setting.MassOrderConfig&&customerInfo.Setting.MassOrderConfig.FrequentTravellerCostCenterMode
        if(costCenter===0){
            passenger.CostCenter = user_info&&user_info.SettlementSubjectName
        }else if(costCenter===2){
            passenger.CostCenter = customerInfo.Setting.MassOrderConfig.FrequentTravellerCostCenter
        }
        passenger.NationalName = passenger.NationalName?passenger.NationalName:passenger.Nationality?passenger.Nationality:null
        return (
            <View style={{ flex:1}}>
            {
                ViewUtil.getNameTips()
            }
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" style={GlobalStyles.keyViewSy} showsVerticalScrollIndicator={false}>
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
                                  bt_text={passenger?.Customer?.Name} 
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
                            required={true} 
                            bt_text={passenger.LastName} 
                            _placeholder={'姓氏'} 
                            warm_text={'需与证件一致'} 
                            _callBack={(text)=>{
                                passenger.LastName = text;
                                this.setState({});
                            }}
                            isEnName={true}
                />
                <Bt_inputView dicKey={'英文名'}
                                  required={true} 
                                  bt_text={passenger.FirstName} 
                                  _placeholder={'名'} 
                                  warm_text={'需与证件一致'} 
                                  _callBack={(text)=>{
                                        passenger.FirstName = text;
                                        this.setState({});
                                  }}
                                  isEnName={true}
                />
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
                                        this.passenger.NationalCode = item.Code;
                                        this.passenger.NationalName = item.Name;
                                        this.passenger.Nationality = item.Name;
                                        this.passenger.NationalityCode = item.Code;
                                        this.setState({
                                        });
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
                                passenger.CertificateNumber = '';
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
                    (passenger.CertificateType=='身份证' || passenger.CertificateType == 'Chinese ID Card')?null:
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
                                required={(passenger.CertificateType=='身份证'||passenger.CertificateType=="Chinese ID Card")?false:true}
                                _selectName={passenger.IssueNationName}
                                _placeholder={'请选择'} 
                                _callBack={()=>{
                                    this.push('NationalCity', {
                                        refresh: (item) => {
                                            this.passenger.IssueNationCode = item.Code;
                                            this.passenger.IssueNationName = item.Name;
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
                            required={customerInfo.EmailRequired?true:false}
                            _placeholder={customerInfo.EmailRequired?'邮箱(必填)':'邮箱(选填)'}
                            _callBack={(text)=>{
                                passenger.Email = text; this.setState({}) 
                            }}
                />
                {this._CardTravel()}
                {this._flightFavor()}
                {this._approvalOfficer()}
                {this._addApproveAgent()}
                {
                  this.params.index ===1?null://综合订单编辑员工时不显示成本中心
                    customerInfo&&customerInfo.Setting&&customerInfo.Setting.MassOrderConfig&&customerInfo.Setting.MassOrderConfig.FrequentTravellerCostCenterMode===1?
                        <Bt_inputView dicKey={'成本中心'}
                            required={(this.params.title=='新增乘客'||passenger.CostCenterRequired)? true : false} 
                            bt_text={passenger.CostCenter} 
                            _placeholder={(this.params.title=='新增乘客'||passenger.CostCenterRequired)?'请填写成本中心(选填)':'成本中心'} 
                            _callBack={(text)=>{
                                    passenger.CostCenter = text;
                                    this.setState({});
                            }}
                        />
                    :null       
                }
                {
                     customerInfo&&customerInfo.EmployeeDictList && customerInfo.EmployeeDictList.length > 0 ?
                      customerInfo.EmployeeDictList.map((obj, index) => {
                        let itemIndex;
                        // if(obj.BusinessCategory&256){
                            itemIndex = AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(
                                item => item.DictId === obj.Id
                            );
                            if(!itemIndex){
                                itemIndex = obj
                                itemIndex.DictName = obj.Name
                            }
                        // }
                        let remark =  Util.Parse.isChinese() ?obj.Remark: obj.EnRemark 
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
                                />
                                // <View key={index} style={styles.row}>
                                //     {obj.IsRequire?<HighLight name={obj.Name} />:<CustomText text={obj.Name} style={{ flex: 3 }} />}
                                //     {
                                //         obj.NeedInput ?
                                //             <View style={{backgroundColor:obj.IsRequire&& !(itemIndex && itemIndex.ItemName)?'#F7CCD1':'#fff',height:38,flex: 7,justifyContent:'center'}}>
                                //                 <CustomeTextInput style={{ flex: 7 }} value={itemIndex && itemIndex.ItemName} placeholder={remark} editable={obj.IsEditInput} onChangeText={(text) => {
                                //                     this._valueCHange(text, obj);
                                //                 }} />
                                //             </View>
                                //             :
                                //             <View style={{ flex: 7,height:38,
                                //                             flexDirection: 'row',
                                //                             alignItems: 'center',
                                //                             justifyContent: 'space-between',
                                //                             backgroundColor:obj.IsRequire&& !(itemIndex && itemIndex.ItemName)?'#F7CCD1':'#fff'
                                //                         }}>
                                //                 <CustomText text={itemIndex ? itemIndex.ItemInput : remark} style={{ color: itemIndex ? null : 'gray', flex: 1 }} 
                                //                 onPress={()=>{this._toSelectDicList(obj)}} 
                                //                 />
                                //                 <Ionicons name={'chevron-forward'} size={22} color={'lightgray'} />
                                //             </View>
                                //     }
                                // </View>
                            :null
                         )
                     })
                     : null
                    }
                <CustomActioSheet ref={o => this.actionSheet = o} options={options} onPress={this._handlePress} />
                <CustomActioSheet ref={o => this.seatActionSheet = o} options={seatOPtions} onPress={this._seatHandlePress} />
                <CustomActioSheet ref={o => this.mealActionSheet = o} options={mealOptions} onPress={this._mealHandlePress} />
                <CustomActioSheet ref={o => this.GenderActionSheet = o} options={GenderOptions} onPress={this._genderHandlePress} />
                <View style={{marginBottom:50}}></View>
            </KeyboardAwareScrollView>
            {
                ViewUtil.getThemeButton('保存', this._finishBtnClick)
            }

            </View>
        )
    }

    _genderHandlePress = (index) => {
       const { passenger } = this;
       if (index=== 1) {
            passenger.SexDesc = '女';
            passenger.Sex = 2;
            passenger.Gender = 2;
        } else {
            passenger.SexDesc = '男';
            passenger.Sex = 1;
            passenger.Gender = 1;
        }
        this.setState({});
    }

    _approvalOfficer = () => {
        const {addApproveAgentList} = this.state;
        return(
            <SelectView titleName={'审批授权人'}
                        required={false}
                        _clickOnpress={()=>{
                            this.showAlertView('设置审批授权人，可以代替您审批');
                        }}
                        _haveInfoAler={true}
                        _selectName={''} 
                        _callBack={()=>{
                            if(addApproveAgentList.length<2){
                                addApproveAgentList.push({Id:null,Name:null});
                                this.setState({})
                            }
                        }}
            /> 
        )
    }
    _addApproveAgent = () => {
        const {addApproveAgentList} = this.state;
        const { passenger } = this
        return(
            addApproveAgentList&&addApproveAgentList.map(( item,index )=>{
                return( 
                    <TouchableOpacity style={styles.shouquanrenItemStyle} onPress={()=>{
                        this.push('SearchBookerScreen',{
                            _from:'审批授权人',
                            callBack:(data)=>{
                                addApproveAgentList[index] = data;
                                passenger.AuthorizedApprovePerson = addApproveAgentList
                                this.setState({})
                            }
                        })
                    }}>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                        <CustomText text={addApproveAgentList[index].Name?addApproveAgentList[index].Name:'请选择'} style={{color:Theme.commonFontColor,fontSize:14}}></CustomText>
                        <CustomText text={' '} style={{color:Theme.commonFontColor,fontSize:14}}></CustomText>
                        <CustomText text={addApproveAgentList[index].Email?addApproveAgentList[index].Email:''} style={{color:Theme.commonFontColor,fontSize:14}}></CustomText>
                        <AntDesign name={'delete'} 
                                size={20}
                                style={{marginLeft:10}} 
                                color={Theme.theme} 
                                onPress={()=>{
                                      addApproveAgentList.splice(index,1);
                                      passenger.AuthorizedApprovePerson = addApproveAgentList
                                      this.setState({})
                                }} 
                        />
                        </View>
                        <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} />
                    </TouchableOpacity>
                )
            })
      )
    }

    _seatHandlePress=(index)=>{
        const { passenger } = this
        if(index != 'cancel'){
            passenger.Preference&&passenger.Preference.FlightFavor&&passenger.Preference.FlightFavor.SeatPrefCode === FlightSeatList[index].Code
            this.setState({
                SeatPref: FlightSeatList[index]
            })
        }else{
           if(!passenger.Preference&&passenger.Preference.FlightFavor&&passenger.Preference.FlightFavor.SeatPrefCode){
            this.setState({
                SeatPref: null
            })
           }
        }
    }

    _mealHandlePress=(index)=>{
        const { passenger,FlightMealList } = this
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

    _CardTravel = () => {
        const { passenger } = this;
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

    _valueCHange = (text, obj) => {
        const { AdditionIfo } = this.state;
        let itemIndex = AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
        if (itemIndex) {
            itemIndex.ItemName = text;
            itemIndex.DictCode = obj.Code
            itemIndex.NeedInput = obj.NeedInput
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
                RemarkNo:obj.RemarkNo,
                DictCode: obj.Code,
                NeedInput:obj.NeedInput
            }
            AdditionIfo.DictItemList.push(model);
        }
        this.setState({});
    }
    _toSelectDicList = (obj) => {
        const { AdditionIfo } = this.state;
        this.push('DicList', {
            title: Util.Parse.isChinese() ? obj.Name :(obj.EnName?obj.EnName:obj.Name),
            Id: obj.Id,
            callBack: (data) => {
                let dic = AdditionIfo&&AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
                if (dic) {
                    dic.ItemId = data.Id;
                    dic.ItemSerialNumber = data.SerialNumber;
                    dic.ItemInput = `${data.SerialNumber} - ${data.Name} - ${data.EnName}`;
                    dic.ItemName = data.Name;
                    dic.EnName = data.EnName;
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
    rowRight: {
        flex: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
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