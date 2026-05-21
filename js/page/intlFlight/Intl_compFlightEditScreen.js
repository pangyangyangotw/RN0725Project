import React from 'react';
import {
    View,
    Image,
    StyleSheet,
    TouchableHighlight,
    Alert
} from 'react-native';
import SuperView from '../../super/SuperView';
import ViewUtil from '../../util/ViewUtil';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomText from '../../custom/CustomText';
import CustomeTextInput from '../../custom/CustomTextInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Theme from '../../res/styles/Theme';
import GlobalStyles from '../../res/styles/GlobalStyles';
import Util from '../../util/Util';
import CustomActioSheet from '../../custom/CustomActionSheet';
import PickerHelper from '../../common/PickerHelper';
import IntlFlightEnum from '../../enum/IntlFlightEnum';
import I18nUtil from '../../util/I18nUtil';
import ImagePicker from 'react-native-image-picker';
import RNFetchBlob from 'rn-fetch-blob';
import CommonService from '../../service/CommonService';
import HighLight  from '../../custom/HighLight';
import UserInfoDao from '../../service/UserInfoDao'
import { Bt_inputView, InfoDicView, SelectView,No_inputView }  from '../../custom/HighLight';
import { connect } from 'react-redux';
import StorageUtil from '../../util/StorageUtil';
import Key from '../../res/styles/Key';
 
// let textInput = React.createRef();
class Intl_compFlightEditScreen extends SuperView {
    constructor(props) {
        super(props);
     
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.passenger = Util.Encryption.clone(this.params.passenger || { Gender: null,CertificateType : '护照' });
        this._navigationHeaderView = {
            title:this.params.title||"编辑乘客",
            // rightButton: ViewUtil.getRightButton('完成', this._finishBtnClick)
        }
        // let options = ['护照', '台湾通行证', '港澳通行证（含电子港澳通行证）', '台湾居民来往大陆通行证', '港澳居民来往内地通行证', '港澳台居民居住证', '外国人永久居留身份证','大陆居民往来台湾通行证','外交部签发的驻华外交人员证','民航局规定的其他有效乘机身份证件'];
        let options = ['护照','港澳通行证（含电子港澳通行证）', '台湾居民来往大陆通行证', '港澳居民来往内地通行证','大陆居民往来台湾通行证'];
        if(this.params.from === 'presonal' ||this.params.from === 'em_presonal'){
            options.unshift("身份证");
        }
        let additionArr = this.passenger && this.passenger.Addition?this.passenger.Addition: 
                          this.passenger&&this.passenger.AdditionInfo?this.passenger.AdditionInfo:null

        let isGatCh = false;//标记是不是港澳台大陆往返
        let isCHTW = false;//标记是不是台湾大陆往返
        let isGACh = false;//标记是不是港澳大陆往返
        let isGAT = false;//标记是不是港澳台往返
        let travelcode = [];
        //goFlightData的list里DestinationNationalCode，DepartureNationalCode是港澳台或大陆的标记true
        if(this.params.goFlightData && this.params.goFlightData.list && this.params.goFlightData.list.length > 0){
            let DestinationNationalCode = this.params.DestinationNationalCode;
            let DepartureNationalCode = this.params.DepartureNationalCode;
            if(DepartureNationalCode === 'HK' || DepartureNationalCode === 'MO' || DepartureNationalCode === 'CN'){
                // DestinationNationalCode也是港、澳、台或大陆 的标记true
                if(DestinationNationalCode === 'HK' || DestinationNationalCode === 'MO' || DestinationNationalCode === 'CN'){
                    isGACh = true;//是港澳大陆往返
                    travelcode.push("cn-hk","cn-mo");
                }
            }
            if(DepartureNationalCode === 'TW' || DepartureNationalCode === 'CN'){
                if(DestinationNationalCode === 'TW' || DestinationNationalCode === 'CN'){//台湾大陆往返
                    isCHTW = true;//是台湾大陆往返
                    travelcode.push("cn-tw");
                }
            }
            if(DepartureNationalCode === 'HK' || DepartureNationalCode === 'MO' || DepartureNationalCode === 'TW'){
                //DestinationNationalCode也是港、澳、台或大陆 的标记true
                if(DestinationNationalCode === 'HK' || DestinationNationalCode === 'MO' || DestinationNationalCode === 'TW'){
                    isGAT = true;//是港澳台往返
                    travelcode.push("hk-mo","hk-tw","mo-tw");
                }
            }
            //往返行程不含港澳台大陆
            if(!isGatCh && !isCHTW && !isGACh && !isGAT){
                travelcode.push("---");
            }
        }
        this.state = {
            isEditSerinumber: false,
            options: options,
            GenderOptions:['男','女'],
            isEditMobile:false,
            // 数据字典
            AdditionInfo: additionArr ? 
            {
                ...additionArr,
            DictItemList: additionArr.DictItemList ? additionArr.DictItemList : []
            } : {
            DictItemList: []
            },
            // AdditionInfo: this.passenger && this.passenger.AdditionInfo && this.passenger.AdditionInfo ? {
            //     ...this.passenger.AdditionInfo,
            //     DictItemList: this.passenger.AdditionInfo.DictItemList ? this.passenger.AdditionInfo.DictItemList : []
            // } : {
            //     DictItemList: []
            // },
            user_info:{},
            CardTravellerList:[],//常客卡
            CardTravellerIDArr:[],
            CardTravel1:this.passenger.CardTravel1 || [],//常客卡去程
            travelcode:travelcode,
            Country_list:[]
        }
    }
    componentDidMount(){
            let CardTravellerIDArr = [];
            this.passenger.CardTravellerList&&this.passenger.CardTravellerList.map((item)=>{
                    if(item.AirPortId){
                         CardTravellerIDArr.push(item.AirPortId +" "+ item.SerialNumber);
                    }
                })
                this.setState({
                    user_info:this.passenger,
                    CardTravellerList: this.passenger.CardTravellerList,
                    CardTravellerIDArr:CardTravellerIDArr
                })
            StorageUtil.loadKey(Key.CountryTrans).then(responseCounty =>{
                this.setState({
                    Country_list:responseCounty
                })
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
    _finishBtnClick =()=>{
        const { passenger } = this;
        if (!passenger.CertificateExpire) {
            if(!(passenger.CertificateType=='身份证'||passenger.CertificateType=="Chinese ID Card")){
               this.toastMsg('请选择证件有效期');
               return;
            }
       } else {
               let expire = Util.Date.toDate(passenger.CertificateExpire);
               if (!expire) {
                   this.toastMsg('证件有效期不正确');
                   return;
               }
               const isValidFlightData = this.params?.goFlightData?.list?.[0]?.DestinationTime;
               const fallbackDate = new Date(); // 当前时间作为兜底值
               let baseDate = isValidFlightData 
                               ? new Date(isValidFlightData)
                               : fallbackDate;
               // 添加日期有效性二次验证
               if (isNaN(baseDate.getTime())) {
                   console.error('无效的航班时间:', isValidFlightData);
                   baseDate = fallbackDate;
               }
               baseDate.setMonth(baseDate.getMonth() + 6);
               if (baseDate > expire) {
                   if(passenger.CertificateType=="护照" || passenger.CertificateType=="Passport"){
                       this.showAlertView("证件有效期不足半年", () => {
                           return ViewUtil.getAlertButton('确定', () => {
                               this.dismissAlertView();
                           })
                       })
                       return;
                   }else{
                       this.showAlertView("证件有效期不足半年", () => {
                           return ViewUtil.getAlertButton('取消', () => {
                               this.dismissAlertView();
                               return;
                           }, '继续预订', () => {
                               this.dismissAlertView();
                               this._finishBtnClick1();
                           })
                       })
                   }
               }else{
                  this._finishBtnClick1();
               }
           
        //    if (passenger.CertificateExpire && !passenger.CertificateExpire.includes('T')) {
        //        passenger.CertificateExpire += 'T00:00:00';
        //    }
       }
    }
    _finishBtnClick1 = () => {
        const { passenger } = this;
        const { customerInfo,backFlightData,goFlightData} = this.params;
        const { CardTravel1 } = this.state;
        passenger.AdditionInfo = this.state.AdditionInfo;
        if (customerInfo&&customerInfo.EmployeeDictList) {
            for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                const obj = customerInfo.EmployeeDictList[i];
                let dicItem = passenger.AdditionInfo.DictItemList&&passenger.AdditionInfo.DictItemList.find(dic => dic.DictId === obj.Id);
                if (obj.IsRequire && obj.ShowInOrder) {
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
        if (!passenger.Surname) {
            this.toastMsg('请填写英文姓');
            return;
        }
        if (!passenger.GivenName) {
            this.toastMsg('请填写英文名');
            return;
        }
        // if (!passenger.Name) {
        //     this.toastMsg('请填写姓名');
        //     return;
        // }
        if(passenger.CostCenterRequired && !passenger.CostCenter){
            this.toastMsg('请填写成本中心');
            return;
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
        // if (!passenger.IssueNationName && !(passenger.CertificateType=='身份证'||passenger.CertificateType=="Chinese ID Card")) {
        //     this.toastMsg('请选择证件签发国');
        //     return;
        // }
        // if (!passenger.CertificateType) {
        //     this.toastMsg('请选择证件类型');
        //     return;
        // }
        // if (this.params.from !== 'presonal' && this.params.from !== 'em_presonal') {
        //     let isVaild = IntlFlightEnum.validCertificates.some(item => item.desc === passenger.CertificateType);
        //     if (!isVaild) {
        //         this.toastMsg('不支持该证件类型');
        //         return;
        //     }
        // }
        if (!passenger.CertificateNumber) {
            this.toastMsg('请填写证件号码');
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
        
        if (!passenger.Birthday) {
            this.toastMsg('出生日期不能为空');
            return;
        }
        if (passenger.Birthday && !passenger.Birthday.includes('T')) {
            passenger.Birthday += 'T00:00:00';
        }
        if (!passenger.SexDesc && !passenger.Gender) {
            this.toastMsg('请选择性别');
            return;
        }

        if(CardTravel1&&CardTravel1.length>0){
            passenger.CardTravel1 = CardTravel1
        }else{
            passenger.CardTravel1 = null
        }
        if (this.params.from === 'presonal') {
            let Certificate = {
                Type: Util.Read.certificateType(passenger.CertificateType),
                Expire: passenger.CertificateExpire,
                TypeDesc: passenger.CertificateType,
                NationalCode: passenger.NationalCode,
                NationalName: passenger.NationalName,
                SerialNumber: passenger.CertificateNumber,
                IssueNationCode: passenger.IssueNationCode,
                IssueNationName: passenger.IssueNationName
            }
            let cerlist = [];
            if (passenger.CertificateList) {
                cerlist = JSON.parse(passenger.CertificateList);
                cerlist.push(Certificate);
            } else {
                cerlist.push(Certificate);
            }
            let model = {
                Id: passenger.Id,
                Sex: passenger.Sex ? passenger.Sex : 0,
                Name: passenger.Name,
                Birthday: passenger.Birthday,
                Nationality: passenger.Nationality,
                NationalName: passenger.NationalName,
                IssueNationCode: passenger.IssueNationCode,
                IssueNationName: passenger.IssueNationName,
                Mobile: passenger.Mobile,
                Tel: passenger.Tel,
                Email: passenger.Email,
                Certificate: JSON.stringify(Certificate),
                CertificateList: cerlist,
                TravallerCard: '',
                Intro: '',
                EmployeeId: '',
                FirstName: passenger.FirstName,
                MiddleName: '',
                LastName: passenger.LastName,
                IsShare: false,
                CustomerId: 0,
                Status: 1,
                CertificateInfo: Certificate,
                CardTravellerList: {

                },
                SexDesc: passenger.SexDesc
            }
            if (this.params.passenger) {
                this.showLoadingView();
                CommonService.CurrentUserTravellerEdit(model).then(response => {
                    this.hideLoadingView();
                    if (response && response.success) {
                        this.showAlertView('编辑常旅客成功', () => {
                            return ViewUtil.getAlertButton('确定', () => {
                                this.dismissAlertView();
                                this.params.callBack(passenger);
                                this.pop();
                            })
                        })
                    } else {
                        this.toastMsg(response.message || '操作失败');
                    }
                }).catch(error => {
                    this.hideLoadingView();
                    this.toastMsg(error.message || "操作失败");
                })
            } else {
                this.showLoadingView();
                CommonService.CurrentUserTravellerAdd(model).then(response => {
                    this.hideLoadingView();
                    if (response && response.success) {
                        this.showAlertView('添加常旅客成功', () => {
                            return ViewUtil.getAlertButton("确定", () => {
                                this.dismissAlertView();
                                this.params.callBack(passenger);
                                this.pop();
                            })
                        })
                    } else {
                        this.toastMsg(response.message || '添加常旅客失败');
                    }
                }).catch(error => {
                    this.hideLoadingView();
                    this.toastMsg(error.message || '添加常旅客异常');
                })
            }
        } else {
            this.params.callBack(passenger);
            this.pop();
           
        }
    }
    _handlePress = (index) => {
        const { options } = this.state;
        if (this.passenger.CertificateType !== options[index]) {
            this._alert(index);
            
            this.passenger.CertificateType = options[index];
            this.passenger.CertificateNumber = '';
            this.passenger.Expire = '';
            this.passenger.IssueNationName = '';
            this.passenger.IssueNationCode = '';
            this.passenger.CertificateExpire = '';
            if (this.passenger.Certificates) {
                let CertificateList = this.passenger.Certificates || [];
                let Type = Util.Read.certificateType2(this.passenger.CertificateType)
                let obj = CertificateList.find(item => item.Type == Type );
                if (obj) {
                    this.passenger.CertificateNumber = obj.SerialNumber;
                    this.passenger.Expire = obj.Expire;
                    this.passenger.IssueNationName = obj.NationalName;
                    this.passenger.IssueNationCode = obj.NationalCode;
                    this.passenger.CertificateExpire = obj.Expire;
                }
            }
        }
        // textInput.current._root.focus();
        this.setState({});
    }

    _alert=(index)=>{
        const { travelcode,options } = this.state;
        let massage = Util.Parse.isChinese() ? '中国大陆居民如在中国台湾地区中转/经停，须携带后续航班行程单':"Chinese mainland residents transiting/stopping over in TW must carry the itinerary of the connecting flight.";
        let massage2 = Util.Parse.isChinese() ? '中国大陆居民往来香港澳门如使用护照出行，须持有 7 天内前往第三国或地区的机票':"Chinese mainland residents traveling to/from HK or MO who use a passport must hold a ticket to a third country or region within 7 days.";
        let massage3 = Util.Parse.isChinese() ?'入境中国台湾地区须携带有效大陆居民往来台湾通行证和台湾地区入出境许可证':'To enter TW, traveler must carry a valid Mainland Residents Travel Permit for TW and TW entry-exit permit.';
        let title = Util.Parse.isChinese() ? '温馨提示' : 'Warm tip';
        if(travelcode.includes('cn-tw')){
            if(this.passenger.NationalCode == 'CN' && options[index] == '护照' || options[index] == 'Passport'){
                Alert.alert(
                    title,
                    massage,
                    [{
                        text: Util.Parse.isChinese() ? '确定' : 'OK',
                        onPress: () => {}
                    }]
                );
            }
            if(this.passenger.NationalCode == "CN" && options[index] == '大陆居民往来台湾通行证' || options[index] == 'Mainland Travel Permit for Taiwanese Residents'){
                Alert.alert(
                    title,
                    massage3,
                    [{
                        text: Util.Parse.isChinese() ? '确定' : 'OK',
                        onPress: () => {}
                    }]
                );

            }
        }
        if((travelcode?.includes('cn-hk') || travelcode?.includes('cn-mo')) && this.passenger.NationalCode == 'CN' && (options[index] == '护照' || options[index] == 'Passport')){
            Alert.alert(
                title,
                massage2,
                [{
                    text: Util.Parse.isChinese() ? '确定' : 'OK',
                    onPress: () => {}
                }]
            );
        }    
    }

    _handlePressCardTravle = (_index) => {
        const {CardTravellerList} = this.state;
        let arr = [];
        if(_index != 'cancel'){
            CardTravellerList&&CardTravellerList.map((item,index)=>{
                if(index==_index){
                arr.push(item)
                this.setState({
                    CardTravel1:arr
                })
                }
            })
        }else{
            this.setState({
                CardTravel1:null
            })
        }
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
    /**
       * uploadImage
       */
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

    _deletePasseneger = () => {
        const { deletBack } = this.params;
        this.showAlertView('确定要删除常旅客吗？', () => {
            return ViewUtil.getAlertButton('我再想想', () => {
                this.dismissAlertView();
            }, '确定', () => {
                this.dismissAlertView();
                this.showLoadingView();
                CommonService.CurrentUserTravellerRemove({
                    TravellerId: this.passenger.Id
                }).then(response => {
                    this.hideLoadingView();
                    if (response && response.success) {
                        this.showAlertView("删除常旅客成功", () => {
                            return ViewUtil.getAlertButton('确定', () => {
                                this.dismissAlertView();
                                this.pop();
                                deletBack();
                            })
                        })
                    } else {
                        this.toastMsg(response.message || '数据请求失败');
                    }
                }).catch(error => {
                    this.hideLoadingView();
                    this.toastMsg(error.message || '数据请求异常');
                })
            })
        })
    }

    renderBody() {
        const { passenger } = this;
        const { customerInfo ,backFlightData} = this.params; 
        const { isEditSerinumber, isEditMobile, options, AdditionInfo , user_info, CardTravellerIDArr,CardTravel1,GenderOptions,travelcode,Country_list} = this.state;
        const { profileCommonEnum } = this.props;
        let intlflightBookingConfig = profileCommonEnum?.data?.bookingConfig?.intlflightBookingConfig;
        if (passenger.Birthday) {
            if (passenger.Birthday === '0001-01-01T00:00:00') {
                passenger.Birthday = '';
            } else {
                passenger.Birthday = passenger.Birthday.replace(/\//g, '-')
                passenger.Birthday = passenger.Birthday.split('T')[0]
                passenger.Birthday = passenger.Birthday.split(' ')[0] 
            }
        }
        if (passenger.CertificateExpire) {
            if (passenger.CertificateExpire === '0001-01-01T00:00:00'||passenger.CertificateExpire === 'Invalid dateT00:00:00'|| passenger.CertificateExpire === "NaN-aN-aNT00:00:00") {
                passenger.CertificateExpire = '';
            } else {
                passenger.CertificateExpire = passenger.CertificateExpire.split('T')[0] 
                // passenger.CertificateExpire = Util.Date.toDate(passenger.CertificateExpire).format('yyyy-MM-dd');
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
                // str = str +'T00:00:00'
                // passenger.Birthday = Util.Date.toDate(str).format('yyyy-MM-dd');
                passenger.Birthday = str
            }
        }
        let costCenter = customerInfo&&customerInfo.Setting&&customerInfo.Setting.MassOrderConfig&&customerInfo.Setting.MassOrderConfig.FrequentTravellerCostCenterMode
        if(costCenter===0){
            passenger.CostCenter = user_info&&user_info.SettlementSubjectName
        }else if(costCenter===2){
            passenger.CostCenter = customerInfo.Setting.MassOrderConfig.FrequentTravellerCostCenter
        }
        if(passenger.Surname === undefined || passenger.Surname === null){
            passenger.Surname = passenger.LastName
            passenger.GivenName = passenger.FirstName
        }
        if(!passenger.Gender){
            passenger.Gender = passenger.Sex
        }
        // 根据国家代码匹配证件类型
        let configEntry = intlflightBookingConfig?.find(entry => 
            // 判断两个数组是否包含相同的元素 entry.travelcode === travelcode
            entry.travelcode.every(code => travelcode.includes(code)) &&
            travelcode.every(code => entry.travelcode.includes(code))
        );
        // let config = configEntry?.config?.find(c => {//根据国际筛选
        //     const currentNation = c.nation;
        //     const passengerNation = passenger.NationalCode;
        //     return (
        //       currentNation === passengerNation ||
        //       (!['CN','HK','MO','TW'].includes(passengerNation) && currentNation === '_')
        //       ||
        //       (currentNation === "" && !passengerNation)
        //     );
        //   });
          let config = configEntry?.config?.[0]
          if(!passenger.NationalCode){
            config = configEntry?.config?.[0]
          }
          let certTypes = config?.certTypes?.map(item => {
              return Util.Read.typeTocertificate2(item)
          })
          if(!certTypes || certTypes.length === 0){
              certTypes = ['护照']
          }
          let certOrigins = Util.Parse.isChinese()?'护照':'Passport';
          let nationalzhName = '';
          Country_list?.map(item => {
                if(item.Code === passenger.NationalCode){
                    nationalzhName = Util.Parse.isChinese() ? item.Name : item.EnName
                }
          })
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
                            no_editable={true}
                />
                <Bt_inputView dicKey={'英文姓'}
                            required={true} 
                            bt_text={passenger.Surname} 
                            _placeholder={'姓氏'} 
                            warm_text={'需与证件一致'} 
                            _callBack={(text)=>{
                                passenger.Surname = text;
                                this.setState({});
                            }}
                            isEnName={true}

                />
                <Bt_inputView dicKey={'英文名'}
                            required={true} 
                            bt_text={passenger.GivenName} 
                            _placeholder={'名'} 
                            warm_text={'需与证件一致'} 
                            _callBack={(text)=>{
                                passenger.GivenName = text;
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
                            _selectName={nationalzhName?nationalzhName:passenger.NationalName}
                            _placeholder={'请选择国籍/地区'} 
                            _callBack={()=>{
                                this._toSelectCounty(passenger);
                            }}
                />
               <SelectView titleName={'证件类型'}
                            required={false}
                            _selectName={passenger.CertificateType?Util.Read.certificateTransfer(passenger.CertificateType):certOrigins}
                            _placeholder={''} 
                            _callBack={()=>{
                                this.setState({ 
                                    // options: this.state.options
                                    options: certTypes
                                });
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
                            _selectName={passenger.Gender==2?'女':passenger.Gender==1?'男':null}
                            _placeholder={'请选择性别'} 
                            _callBack={()=>{
                                this.GenderActionSheet.show();
                            }}
                />
                <Bt_inputView dicKey={'E-mail'} 
                                bt_text={passenger.Email} 
                                _placeholder={customerInfo.EmailRequired?'邮箱(必填)':'邮箱(选填)'} 
                                _callBack={(text)=>{
                                        passenger.Email = text; 
                                        this.setState({}) 
                                }}
                                required={customerInfo.EmailRequired}
                />

                {
                    this.params.title=='新增乘客' || !(CardTravellerIDArr&&CardTravellerIDArr.length>0) ? null:
                    <SelectView titleName={'去程常客卡'}
                                required={false}
                                _selectName={ CardTravel1&&CardTravel1[0]?CardTravel1[0].AirPortId+" "+CardTravel1[0].SerialNumber:null }
                                _callBack={()=>{
                                    this.CardTravellerActionSheet.show();
                                }}
                    />
                }
                

                {this.params.index ===1?null://综合订单编辑员工时不显示成本中心
                    customerInfo&&customerInfo.Setting.MassOrderConfig.FrequentTravellerCostCenterMode===1?
                        <Bt_inputView dicKey={'成本中心'}
                                    required={(this.params.title=='新增乘客'||passenger.CostCenterRequired) ? true : false} 
                                    bt_text={passenger.CostCenter} 
                                    _placeholder={this.params.title=='新增乘客'||passenger.CostCenterRequired?'请填写成本中心(选填)':'成本中心'} 
                                    _callBack={(text)=>{
                                            passenger.CostCenter = text;
                                            this.setState({});
                                    }}
                        />
                    :null       
                }
                <CustomActioSheet ref={o => this.actionSheet = o} options={options} onPress={this._handlePress} />
                <CustomActioSheet ref={o => this.CardTravellerActionSheet = o} options={CardTravellerIDArr} onPress={this._handlePressCardTravle} />
                <CustomActioSheet ref={o => this.GenderActionSheet = o} options={GenderOptions} onPress={this._selectSex} />
                {/* <CustomActioSheet ref={o => this.CardTravellerActionSheet2 = o} options={CardTravellerIDArr} onPress={this._handlePressCardTravle2} /> */}
                {/* {
                     customerInfo&&customerInfo.EmployeeDictList && customerInfo.EmployeeDictList.length > 0 ?
                     customerInfo.EmployeeDictList.map((obj, index) => {
                         let itemIndex =AdditionInfo.DictItemList.find(item => item.DictId === obj.Id);
                         return (
                             <View key={index} style={styles.row}>
                                 <CustomText text={obj.Name} style={{ flex: 3 }} />
                                 {
                                     obj.NeedInput ?
                                         <CustomeTextInput style={{ flex: 7 }} value={itemIndex && itemIndex.ItemName} placeholder={obj.Remark} onChangeText={(text) => {
                                             this._valueCHange(text, obj);
                                         }} />
                                         :
                                         <View style={styles.rowRight}>
                                             <CustomText text={itemIndex ? itemIndex.ItemName : obj.Remark} style={{ color: itemIndex ? null : 'gray', flex: 1 }} 
                                             onPress={()=>{this._toSelectDicList(obj)}} 
                                             />
                                             <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                                         </View>

                                 }
                             </View>
                         )
                     })
                     : null
                } */}
                  {
                     customerInfo&&customerInfo.EmployeeDictList && customerInfo.EmployeeDictList.length > 0 ?
                      customerInfo.EmployeeDictList.map((obj, index) => {
                        let itemIndex;
                        // if(obj.BusinessCategory&128){
                            itemIndex = AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(
                                item => item.DictCode === obj.Code
                            );
                            if(itemIndex){
                                itemIndex.DictId = obj.Id
                                itemIndex.DictName = obj.Name
                                itemIndex.DictEnName = obj.EnName
                            }
                            if(!itemIndex){
                                itemIndex = obj
                                itemIndex.DictName = obj.Name
                            }
                        // } 
                         return (
                            itemIndex&&obj.ShowInOrder?
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
                            //      {obj.IsRequire?<HighLight name={obj.Name} />:<CustomText text={obj.Name} style={{ flex: 3 }} />}
                            //      {
                            //          obj.NeedInput ?
                            //              <View style={{backgroundColor:obj.IsRequire&& !(itemIndex && itemIndex.ItemName)?'#F7CCD1':'#fff',height:38,flex: 7,justifyContent:'center'}}>
                            //                 <CustomeTextInput style={{ flex: 7 }} value={itemIndex && itemIndex.ItemName} placeholder={obj.Remark} editable={obj.IsEditInput}
                            //                 onChangeText={(text) => {
                            //                     this._valueCHange(text, obj);
                            //                 }} />
                            //              </View>
                            //              :
                            //              <View style={{ flex: 7,height:38,
                            //                             flexDirection: 'row',
                            //                             alignItems: 'center',
                            //                             justifyContent: 'space-between',
                            //                             backgroundColor:obj.IsRequire&& !(itemIndex && itemIndex.ItemName)?'#F7CCD1':'#fff'
                            //                          }}>
                            //                  <CustomText text={itemIndex ? itemIndex.ItemInput : obj.Remark} style={{ color: itemIndex ? null : 'gray', flex: 1 }} 
                            //                  onPress={()=>{this._toSelectDicList(obj)}} 
                            //                  />
                            //                  <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                            //              </View>
                            //      }
                            // </View>
                            :null
                         )
                     })
                     : null
                }
                <View style={{height:30}}></View>
            </KeyboardAwareScrollView>
            {
                this.params.isDelet ?
                    ViewUtil.getTwoBottomBtn('删除', this._deletePasseneger,'完成', this._finishBtnClick)
                    :
                    ViewUtil.getThemeButton('完成', this._finishBtnClick)
            }

            </View>
        )
    }
    _toSelectCounty = (passenger) => {
        const { profileCommonEnum } = this.props;
        const { travelcode } = this.state;
        let intlflightBookingConfig = profileCommonEnum?.data?.bookingConfig?.intlflightBookingConfig;
        this.push('NationalCity', {
            refresh: (item) => {
                const configEntry = intlflightBookingConfig?.find(entry => 
                    // 判断两个数组是否包含相同的元素 entry.travelcode === travelcode
                    entry.travelcode.every(code => travelcode.includes(code)) &&
                    travelcode.every(code => entry.travelcode.includes(code))
                );
                // 检查是否需要显示提示，提示语是checkChange里的message，点击确定后切换为checkChange里的changeCertType
                const checkChangeConfig = configEntry?.config?.find(cfg => {
                    const isNationMatch = cfg.nation === '' || 
                        cfg.nation === item.Code ||
                        (cfg.nation === '_' && !['CN','HK','MO','TW'].includes(item.Code));
                    return isNationMatch && cfg.checkChange?.length > 0;
                });
                let certType
                if(!this.passenger.CertificateType){
                    certType = 2 //默认护照
                }else{
                    certType = Util.Read.certificateType2(this.passenger.CertificateType)
                }

                if (checkChangeConfig && !checkChangeConfig?.certTypes.includes(certType)) {
                    const changeRule = checkChangeConfig.checkChange?.find(r => r.certType === certType);
                    let title = Util.Parse.isChinese() ? '温馨提示' : 'Warm tip';
                    if (changeRule) {
                        Alert.alert(
                            title,
                            changeRule.message,
                            [{
                                text: Util.Parse.isChinese() ? '确定' : 'OK',
                                onPress: () => this.handleCertTypeChange(changeRule.changeCertType)
                            }]
                        );
                    }
                }else if(checkChangeConfig && checkChangeConfig?.certTypes.includes(certType)){
                    const changeRule = checkChangeConfig.checkChange?.find(r => r.certType === certType);
                    let title = Util.Parse.isChinese() ? '温馨提示' : 'Warm tip';
                    if (changeRule) {
                        Alert.alert(
                            title,
                            changeRule.message,
                            [{
                                text: Util.Parse.isChinese() ? '确定' : 'OK',
                                onPress:() => this.handleCertTypeChange(changeRule.changeCertType)
                            }]
                        );
                    }
                }
                
                passenger.NationalCode = item.Code;
                passenger.NationalName = item.Name;
                passenger.Nationality = item.Code;
                this.passenger.IssueNationCode = item.Code;
                this.passenger.IssueNationName = item.Name;
                this.setState({});  
            },
        });
    }
    handleCertTypeChange = (newCertType) => {
        this.passenger.CertificateType = Util.Read.typeTocertificate2(newCertType);
        let CertificateItem ;
        this.passenger.Certificates?.filter(item => {
                if(item.Type == newCertType){
                CertificateItem = item;
            }
        });
        this.passenger.CertificateNumber =  CertificateItem?.SerialNumber || ''
        this.passenger.CertificateExpire =  CertificateItem?.Expire || ''
        this.passenger.Expire =  CertificateItem?.Expire || ''
        this.setState(prevState => ({
            passenger: {
                ...prevState.passenger,
                CertificateType: this.passenger.CertificateType,
                CertificateNumber:this.passenger.CertificateNumber,
                Expire: this.passenger.Expire,
                CertificateExpire: this.passenger.CertificateExpire
            }
        }));     
    }
    /**
     *  选择性别
     */
     _selectSex = (index) => {
        if(index === 0) {
            this.passenger.Gender = 1
            this.passenger.SexDesc = '男'
        }else{
            this.passenger.Gender = 2
            this.passenger.SexDesc = '女'
        }
        this.setState({});
    }
    _valueCHange = (text, obj) => {
        const { AdditionInfo } = this.state;
        let itemIndex = AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(item => item.DictCode === obj.Code);
        if (itemIndex) {
            itemIndex.ItemName = text;
            itemIndex.DictCode = obj.Code
            itemIndex.NeedInput = obj.NeedInput
        } else {
            let model = {
                DictId: obj.Id,
                id: obj.Id,
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
            AdditionInfo.DictItemList.push(model);
        }
        this.setState({});
    }
    _toSelectDicList = (obj) => {
        const { AdditionInfo } = this.state;
        this.push('DicList', {
            title: Util.Parse.isChinese() ? obj.Name :(obj.EnName?obj.EnName:obj.Name),
            Id: obj.Id,
            callBack: (data) => {
                let dic = AdditionInfo&&AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(item => item.DictId === obj.Id);
                if (dic) {
                    dic.ItemId = data.Id;
                    dic.Id = data.Id;
                    dic.ItemSerialNumber = data.SerialNumber;
                    dic.ItemInput = `${data.SerialNumber} - ${data.Name} - ${data.EnName}`;
                    dic.ItemName = data.Name;
                    dic.EnName = data.EnName;
                    // dic.ItemInput = data.SerialNumber+" - "+data.Name+" - "+data.EnName;
                    dic.DictCode = obj.Code
                    dic.NeedInput = obj.NeedInput
                } else {
                    let model = {
                        DictId: obj.Id,
                        Id: obj.Id,
                        DictName: obj.Name,
                        ItemId: data.Id,
                        ItemSerialNumber: data.SerialNumber,
                        ItemInput: `${data.SerialNumber} - ${data.Name} - ${data.EnName}`,
                        ItemName: data.Name,
                        FormatRegexp:obj.FormatRegexp,
                        EnName:data.EnName,
                        RemarkNo:obj.RemarkNo,
                        // ItemInput: data.SerialNumber+" - "+data.Name+" - "+data.EnName,
                        DictCode: obj.Code,
                        NeedInput:obj.NeedInput
                    }
                    AdditionInfo&&AdditionInfo.DictItemList.push(model);
                }
                this.setState({});

            }
        })
    }
}
const getStatusProps = state => ({
    profileCommonEnum: state.profileCommonEnum,   
})
export default connect(getStatusProps)(Intl_compFlightEditScreen);
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
    }
    
})
