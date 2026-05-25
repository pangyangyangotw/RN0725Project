import React from 'react';
import {
    View,
    Image,
    StyleSheet,
    TouchableHighlight,
    Text
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
import UserInfoDao from '../../service/UserInfoDao';
import { connect } from 'react-redux';
 
// let textInput = React.createRef();
class IntlFlightEditScreen extends SuperView {
    constructor(props) {
        super(props);
        this._enNameToastTs = 0;
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.passenger = Util.Encryption.clone(this.params.passenger || { SexDesc: '男', Sex: 1,CertificateType : '护照' });
        this._navigationHeaderView = {
            title:this.params.title||"编辑乘客",
            // rightButton: ViewUtil.getRightButton('完成', this._finishBtnClick)
        }
        let options = ['护照', '台湾通行证', '港澳通行证（含电子港澳通行证）', '台湾居民来往大陆通行证', '港澳居民来往内地通行证', '港澳台居民居住证', '外国人永久居留身份证','大陆居民往来台湾通行证','外交部签发的驻华外交人员证','民航局规定的其他有效乘机身份证件'];
        if(this.params.from === 'presonal' ||this.params.from === 'em_presonal'){
            options.unshift("身份证");
        }
        this.state = {
            isEditSerinumber: false,
            options: options,
            isEditMobile:false,
             // 数据字典
            // AdditionInfo: this.passenger && this.passenger.AdditionInfo && this.passenger.AdditionInfo ? {
            //     ...this.passenger.AdditionInfo,
            //     DictItemList: this.passenger.AdditionInfo.DictItemList ? this.passenger.AdditionInfo.DictItemList : []
            // } : {
            //         DictItemList: []
            // },
            AdditionInfo: this.passenger && this.passenger.Addition && this.passenger.Addition ? {
                ...this.passenger.Addition,
                DictItemList: this.passenger.Addition.DictItemList ? this.passenger.Addition.DictItemList : []
            } : {
                    DictItemList: []
            },
            user_info:{},
            CardTravellerList:[],//常客卡
            CardTravellerIDArr:[],
            CardTravel1:this.passenger.CardTravel1 || [],//常客卡去程
        }
    }
    componentDidMount(){
        UserInfoDao.getUserInfo().then(response => {
            if(response){
                this.setState({
                    user_info:response,
                })
            }
        }) 

        let CardTravellerIDArr = [];
        this.passenger.CardTravellerList&&this.passenger.CardTravellerList.map((item)=>{
            if(item.AirPortId){
                CardTravellerIDArr.push(item.AirPortId +" "+ item.SerialNumber);
            }
        })
        this.setState({
            CardTravellerList: this.passenger.CardTravellerList,
            CardTravellerIDArr:CardTravellerIDArr
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
        const { CardTravel1 } = this.state;
        const { customerInfo,backFlightData,goFlightData} = this.params;
        passenger.AdditionInfo = this.state.AdditionInfo;
        passenger.Addition = this.state.AdditionInfo;
        if (customerInfo&&customerInfo.EmployeeDictList) {
            for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                const obj = customerInfo.EmployeeDictList[i];
                let dicItem = passenger.AdditionInfo.DictItemList&&passenger.AdditionInfo.DictItemList.find(dic => dic.DictId === obj.Id);
                if (obj.IsRequire && obj.BusinessCategory&32) {
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
        if (!passenger.Name) {
            this.toastMsg('请填写姓名');
            return;
        }
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
        if (!passenger.NationalCode &&(!passenger.NationalName&&!passenger.Nationality)) {
            this.toastMsg('请选择国籍/地区');
            return;
        }
        // if (!passenger.NationalName) {
        //     this.toastMsg('请选择国籍');
        //     return;
        // }
        if (!passenger.IssueNationName && !(passenger.CertificateType=='身份证'||passenger.CertificateType=="Chinese ID Card")) {
            this.toastMsg('请选择证件签发国');
            return;
        }
        // if (!passenger.CertificateType) {
        //     this.toastMsg('请选择证件类型');
        //     return;
        // }
        if (this.params.from !== 'presonal' && this.params.from !== 'em_presonal') {
            let isVaild = IntlFlightEnum.validCertificates.some(item => (item.desc === passenger.CertificateType || item.descEn === passenger.CertificateType));
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
             if(!(passenger.CertificateType=='身份证'||passenger.CertificateType=="Chinese ID Card")){
                this.toastMsg('请选择证件有效期');
                return;
             }
        } else {
            let now = new Date();
            // if (Util.Date.toDate(passenger.CertificateExpire) < now.setMonth(now.getMonth() + 6)) {
            //     this.toastMsg('证件有效期不足半年');
            //     return;
            // }
            if (passenger.CertificateExpire && !passenger.CertificateExpire.includes('T')) {
                Util.Parse.isChinese()?
                passenger.CertificateExpire += 'T00:00:00'
                :null
            }
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
            Util.Parse.isChinese()?
            passenger.Birthday += 'T00:00:00'
            :
            null
        }
        // if (!passenger.SexDesc) {
        //     this.toastMsg('请选择性别');
        //     return;
        // }

        if(CardTravel1&&CardTravel1.length>0){
            passenger.CardTravel1 = CardTravel1
        }else{
            passenger.CardTravel1 = null;
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
                NationalCode: passenger.NationalCode,
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
                FirstName: passenger.GivenName,
                MiddleName: '',
                LastName: passenger.Surname,
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
            // this.push('FlightOrderScreeb');
            this.pop();
           
        }
    }
    _handlePress = (index) => {
        const { options } = this.state;
        if (this.passenger.CertificateType !== options[index]) {
            this.passenger.CertificateType = options[index];
            this.passenger.CertificateNumber = '';
            this.passenger.Expire = '';
            this.passenger.CertificateExpire = '';
            this.passenger.IssueNationName='';
            this.passenger.IssueNationCode='';
            if (this.passenger.Certificate) {
                if(this.props.apply){
                    this.passenger.CertificateNumber = this.passenger.Certificate.SerialNumber;
                    this.passenger.Expire = this.passenger.Certificate.Expire;
                    this.passenger.IssueNationName = this.passenger.Certificate.IssueNationName;
                    this.passenger.IssueNationCode = this.passenger.Certificate.IssueNationCode;
                    this.passenger.CertificateExpire = this.passenger.Certificate.Expire;
                }else{
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
        }
        // textInput.current._root.focus();
        this.setState({});
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
        const { customerInfo,noComp } = this.params;  
        const { isEditSerinumber, isEditMobile,options, AdditionInfo , user_info,CardTravellerIDArr,CardTravel1 ,backFlightData} = this.state;
        if (passenger.Birthday) {
            if (passenger.Birthday === '0001-01-01T00:00:00') {
                passenger.Birthday = '';
            } else {
                passenger.Birthday = Util.Date.toDate(passenger.Birthday).format('yyyy-MM-dd');
            }
        }
        if(passenger.CertificateExpire === "Invalid date" || passenger.CertificateExpire === "NaN-aN-aNT00:00:00"){passenger.CertificateExpire =''}
        if (passenger.CertificateExpire) {
            if (passenger.CertificateExpire === '0001-01-01T00:00:00'||passenger.CertificateExpire === 'Invalid dateT00:00:00') {
            } else {
                passenger.CertificateExpire=passenger.CertificateExpire.replace("T00:00:00", " ")
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
                passenger.Birthday = Util.Date.toDate(str).format('yyyy-MM-dd');
            }
        }
        let costCenter = customerInfo&&customerInfo.Setting&&customerInfo.Setting.MassOrderConfig&&customerInfo.Setting.MassOrderConfig.FrequentTravellerCostCenterMode
        if(costCenter===0){
            passenger.CostCenter = user_info&&user_info.SettlementSubjectName
        }else if(costCenter===2){
            passenger.CostCenter = customerInfo.Setting.MassOrderConfig.FrequentTravellerCostCenter
        }
        return (
            <View style={{ flex:1}}>
            {
                ViewUtil.getNameTips()
            }
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" style={GlobalStyles.keyViewSy} showsVerticalScrollIndicator={false}>
                <View style={styles.row}>
                    {/* <CustomText text='姓名' style={styles.text} /> */}
                    <HighLight  name={'姓名'} value={passenger.Name}/>
                    <View style={{backgroundColor:passenger.Name?'#fff':'#F7CCD1',height:38,flex: 7,justifyContent:'center'}}>
                    <CustomeTextInput style={styles.input} value={passenger.Name} placeholder={'证件上的真实姓名'} onChangeText={text => {
                        passenger.Name = text;
                        this.setState({});
                    }} />
                    </View>
                </View>
                <View style={styles.row}>
                    <HighLight  name={'英文姓'} value={passenger.Surname}/>
                    <View style={{backgroundColor:passenger.Surname?'#fff':'#F7CCD1',height:38,flex: 7,justifyContent:'center'}}>
                        <CustomeTextInput style={styles.input} placeholder={'姓氏'} value={passenger.Surname} onChangeText={text => {
                            if (!text || !Util.RegEx.isEnName(text)) {
                                passenger.Surname = text;
                                this.setState({});
                                return;
                            }
                            const now = Date.now();
                            if (now - this._enNameToastTs > 800) {
                                this._enNameToastTs = now;
                                this.toastMsg('英文姓只能包含字母');
                            }
                        }} />
                    </View>
                </View>
                <View style={{ paddingHorizontal: 10,paddingRight:34, paddingVertical: 2, backgroundColor: "#F7CCD1",flexDirection:'row' }}>
                   <CustomText style={{ fontSize: 14, color:'red', lineHeight:20 }} text='请输入您的英文姓，与旅行证件上保持一致' />
                </View>
                <View style={styles.row}>
                    <HighLight  name={'英文名'} value={passenger.GivenName}/>
                    <View style={{backgroundColor:passenger.GivenName?'#fff':'#F7CCD1',height:38,flex: 7,justifyContent:'center'}}>
                        <CustomeTextInput style={styles.input} value={passenger.GivenName} placeholder={'名'} onChangeText={text => {
                            if (!text || !Util.RegEx.isEnName(text)) {
                                passenger.GivenName = text;
                                this.setState({});
                                return;
                            }
                            const now = Date.now();
                            if (now - this._enNameToastTs > 800) {
                                this._enNameToastTs = now;
                                this.toastMsg('英文名只能包含字母');
                            }
                        }} />
                    </View>
                </View>
                <View style={{ paddingHorizontal: 10,paddingRight:34, paddingVertical: 2, backgroundColor: "#F7CCD1",flexDirection:'row' }}>
                   <CustomText style={{ fontSize: 14, color:'red', lineHeight:20 }} text='请输入您的英文名，与旅行证件上保持一致' />
                </View>
                <View style={styles.row}>
                    {/* <CustomText text='手机号' style={styles.text} /> */}
                    <HighLight  name={'手机号'} value={passenger.Mobile}/>
                    <View style={{backgroundColor:passenger.Mobile?'#fff':'#F7CCD1',height:38,flex: 7,justifyContent:'center'}}>
                        <CustomeTextInput style={styles.input} 
                                        value={isEditMobile?passenger.Mobile:passenger.Mobile&&passenger.Mobile.replace(/(\d{3})(\d{4})(\d{4})/,"$1****$3")} 
                                        onFocus={() =>{
                                            passenger.Mobile = '';
                                            this.setState({ isEditMobile: true })
                                        }}
                                        onBlur={() => this.setState({ isEditMobile: false })}
                                        placeholder={'手机号'} keyboardType='numeric' onChangeText={text => {
                            passenger.Mobile = text;
                            this.setState({});
                        }} />
                    </View>
                </View>
                <View style={styles.row}>
                    {/* <CustomText text='国籍' style={{ flex: 3 }} /> */}
                    <HighLight  name={'国籍/地区'} value={passenger.NationalName? passenger.NationalName :''}/>
                    <View style={{backgroundColor:noComp?(passenger.NationalName?'#fff':'#F7CCD1'):(passenger.NationalName?'#fff':'#F7CCD1'),height:38,flex: 7,justifyContent:'center'}}>
                        <View style={styles.right}>
                        { noComp?
                            <CustomText style={{ flex: 1, color:passenger.NationalName ? 'black' : 'lightgray' }} text={passenger.NationalName?passenger.NationalName:'请选择国籍/地区'} onPress={() => {
                                this.push('NationalCity', {
                                    refresh: (item) => {
                                        this.passenger.NationalityCode = item.Code;
                                        this.passenger.NationalName = item.Name;
                                        this.passenger.Nationality = item.Name;
                                        this.setState({
                                        });
                                    }
                                });
                            }} />
                            :
                            <CustomText style={{ flex: 1, color:passenger.NationalCode&&passenger.NationalName ? 'black' : 'lightgray' }} text={passenger.NationalCode&&passenger.NationalName ?passenger.NationalName:'请选择国籍/地区'} onPress={() => {
                                this.push('NationalCity', {
                                    refresh: (item) => {
                                        this.passenger.NationalCode = item.Code;
                                        this.passenger.NationalName = item.Name;
                                        this.passenger.Nationality = item.Name;
                                        this.setState({
                                        });
                                    }
                                });
                            }} />
                        } 

                            <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                        </View>
                    </View>
                </View>
                <View style={styles.row}>
                    <CustomText text='证件类型' style={{ flex: 3 }} />
                    <View style={styles.right}>
                        <CustomText style={{ flex: 1 }} text={passenger.CertificateType} onPress={() => {
                            this.actionSheet.show();
                        }} />
                        <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                    </View>
                </View>
                <View style={styles.row}>
                    {/* <CustomText text='证件号码' style={{ flex: 3 }} /> */}
                    <HighLight  name={'证件号码'} value={passenger.CertificateNumber}/>
                    <View style={{backgroundColor:passenger.CertificateNumber?'#fff':'#F7CCD1',height:38,flex: 7,justifyContent:'center'}}>
                        <CustomeTextInput style={{ flex: 7 }} placeholder='证件号码(必填)'
                            value={isEditSerinumber ? passenger.CertificateNumber : Util.Read.simpleReplace(passenger.CertificateNumber)}
                            onFocus={() => 
                                {passenger.CertificateNumber = ''
                                this.setState({ isEditSerinumber: true })}
                            }
                            onBlur={() => this.setState({ isEditSerinumber: false })}
                            onChangeText={(text) => {
                                if (this.state.isEditSerinumber) {
                                    passenger.CertificateNumber = text;
                                    this.setState({});
                                }
                            }}
                            // ref={textInput}
                        />
                    </View>
                </View>
                {
                (passenger.CertificateType == '身份证'|| passenger.CertificateType == 'Chinese ID Card')?null:
                <View style={styles.row}>
                    {/* <CustomText text='有效期至' style={{ flex: 3 }} /> */}
                    <HighLight  name={'有效期至'} value={passenger.CertificateExpire}/>
                    <View style={{backgroundColor:passenger.CertificateExpire?'#fff':'#F7CCD1',height:38,flex: 7,justifyContent:'center'}}>
                        <View style={styles.right}>
                            <CustomText style={{ flex: 1 }} text={passenger.CertificateExpire} onPress={() => {
                                this._pickerExpire()
                            }} />
                            <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                        </View>
                    </View>
                </View>
                }
                {/* <View style={styles.row}>
                    <CustomText text='证件上传' style={{ flex: 3 }} />
                    <TouchableHighlight underlayColor='transparent' style={{ flex: 7 }} onPress={this._selectImage}>
                        <View style={[styles.right, { justifyContent: 'space-between' }]}>
                            {
                                soure ? <Image style={{ width: 40, height: 40, backgroundColor: 'red' }} source={soure} /> : <View></View>
                            }
                            <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                        </View>
                    </TouchableHighlight>
                </View> */}
                <View style={styles.row}>
                    {
                        (passenger.CertificateType=='身份证'||passenger.CertificateType=="Chinese ID Card")?
                            <CustomText text='证件签发国' style={{ flex: 3 }} />:
                            <HighLight  name={'证件签发国'} style={{ flex: 3 }}/>
                    }  
                    <View style={{backgroundColor:passenger.IssueNationName&&passenger.IssueNationCode?'#fff':'#F7CCD1',height:38,flex: 6.5,justifyContent:'center'}}>
                    <View style={[styles.right]}>
                        <CustomText style={{ flex: 1, color: passenger.IssueNationName&&passenger.IssueNationCode ? 'black' : 'lightgray' }} text={passenger.IssueNationName&&passenger.IssueNationCode ? passenger.IssueNationName : '请选择'} onPress={() => {
                            this.push('NationalCity', {
                                refresh: (item) => {
                                    this.passenger.IssueNationCode = item.Code;
                                    this.passenger.IssueNationName = item.Name;
                                    this.setState({
                                    });
                                }
                            });
                        }} />
                        <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                    </View>
                    </View>
                </View>
                <View style={styles.row}>
                    {/* <CustomText text='出生日期' style={{ flex: 3 }} /> */}
                    <HighLight  name={'出生日期'} value={passenger.Birthday}/>
                    <View style={{backgroundColor:passenger.Birthday?'#fff':'#F7CCD1',height:38,flex: 7,justifyContent:'center'}}>
                    <View style={styles.right}>
                        <CustomText style={{ flex: 1 }} text={passenger.Birthday} onPress={() => {
                            this._pickerShow();
                        }} />
                        <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                    </View>
                    </View>
                </View>
                <View style={styles.row}>
                    <CustomText text='性别' style={{ flex: 3 }} />
                    <View style={styles.right}>
                        <CustomText style={{ flex: 1 }} text={passenger.Gender==1?'男':'女'} onPress={() => {
                            if (passenger.SexDesc === '男') {
                                passenger.SexDesc = '女';
                                passenger.Sex = 2;
                                passenger.Gender=2
                            } else {
                                passenger.SexDesc = '男';
                                passenger.Sex = 1;
                                passenger.Gender=1
                            }
                            this.setState({});
                        }} />
                        <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                    </View>
                </View>
                <View style={styles.row}>
                    {customerInfo.EmailRequired?<HighLight name={'E-mail'} value={passenger.Email}/>:<CustomText text='E-mail' style={{ flex: 3 }} />}
                    <View style={{backgroundColor:passenger.Email?'#fff':'#F7CCD1',height:38,flex: 7,justifyContent:'center'}}>
                    <CustomeTextInput style={{ flex: 7 }} placeholder={customerInfo.EmailRequired?'邮箱(必填)':'邮箱(选填)'}value={passenger.Email} 
                         onChangeText={text => { passenger.Email = text; this.setState({}) }} />
                    </View>
                </View>

                {
                    this.params.title=='新增乘客' || !(CardTravellerIDArr&&CardTravellerIDArr.length>0) ? null:
                        <View style={styles.row}>
                            <CustomText text='去程常客卡' style={{ flex: 3 }} />
                            <View style={styles.right}>
                                <CustomText style={{ flex: 1 }} onPress={() => {
                                    this.CardTravellerActionSheet.show();
                                }} 
                                text={ CardTravel1&&CardTravel1[0]?CardTravel1[0].AirPortId+" "+CardTravel1[0].SerialNumber:null } 
                                />
                                <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                            </View>
                        </View>
                }

                {this.params.index ===1?null://综合订单编辑员工时不显示成本中心
                    customerInfo&&customerInfo.Setting.MassOrderConfig.FrequentTravellerCostCenterMode===1?
                        <View style={styles.row}>
                            {(this.params.title=='新增乘客'||passenger.CostCenterRequired)?<HighLight name={'成本中心'} value={passenger.CostCenter}/>:<CustomText text='成本中心' style={{ flex: 3 }} />}
                            <View style={{backgroundColor:(this.params.title=='新增乘客'||passenger.CostCenterRequired)&& !passenger.CostCenter?'#F7CCD1':'#fff',height:38,flex: 7,justifyContent:'center'}}>
                            <CustomeTextInput style={styles.input} value={passenger.CostCenter} onChangeText={text => {
                                passenger.CostCenter = text;
                                this.setState({});
                            }} placeholder={this.params.title=='新增乘客'||passenger.CostCenterRequired?'请填写成本中心(选填)':'成本中心'} />
                            </View>
                        </View> 
                    :null       
                }
                <CustomActioSheet ref={o => this.actionSheet = o} options={options} onPress={this._handlePress} />
                <CustomActioSheet ref={o => this.CardTravellerActionSheet = o} options={CardTravellerIDArr} onPress={this._handlePressCardTravle} />
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
                        // if(obj.BusinessCategory&32){
                            itemIndex = AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(
                                item => item.DictId === obj.Id
                            );
                            if(!itemIndex){
                                itemIndex = obj
                                itemIndex.DictName = obj.Name
                            }
                        // } 
                         return (
                            itemIndex&&obj.ShowInOrder?
                            <View key={index} style={styles.row}>
                                 {obj.IsRequire?<HighLight name={Util.Parse.isChinese()? obj.Name:obj.EnName} />:<CustomText text={Util.Parse.isChinese()? obj.Name:obj.EnName} style={{ flex: 3 }} />}
                                 {
                                     obj.NeedInput ?
                                         <View style={{backgroundColor:obj.IsRequire&& !(itemIndex && itemIndex.ItemName)?'#F7CCD1':'#fff',height:38,flex: 7,justifyContent:'center'}}>
                                            <CustomeTextInput style={{ flex: 7 }} 
                                                value={itemIndex && itemIndex.ItemName} 
                                                placeholder={obj.Remark} 
                                                editable={obj.IsEditInput} 
                                                onChangeText={(text) => {
                                                    this._valueCHange(text, obj);
                                                }} />
                                         </View>
                                         :
                                         <View style={{ flex: 7,height:38,
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        backgroundColor:obj.IsRequire&& !(itemIndex && itemIndex.ItemName)?'#F7CCD1':'#fff'
                                                     }}>
                                             <CustomText text={itemIndex ? (Util.Parse.isChinese()?itemIndex.ItemInput:itemIndex.ItemEnName) : obj.Remark} style={{ color: itemIndex ? null : 'gray', flex: 1 }} 
                                             onPress={()=>{this._toSelectDicList(obj)}} 
                                             />
                                             <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                                         </View>
                                 }
                            </View>
                            :null
                         )
                     })
                     : null
                }
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
    _valueCHange = (text, obj) => {
        const { AdditionInfo } = this.state;
        let itemIndex = AdditionInfo.DictItemList&&AdditionInfo.DictItemList.find(item => item.DictId === obj.Id);
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
                    dic.ItemSerialNumber = data.SerialNumber;
                    dic.ItemInput = `${data.SerialNumber} - ${data.Name} - ${data.EnName}`;
                    dic.ItemName = data.Name;
                    // dic.EnName = data.EnName
                    dic.ItemEnName = data.EnName
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
                        // EnName:data.EnName,
                        ItemEnName:data.EnName,
                        RemarkNo:obj.RemarkNo,
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
const getStateProps = state => ({
    feeType: state.feeType.feeType,
    apply: state.apply.apply
})
export default connect(getStateProps)(IntlFlightEditScreen);
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
