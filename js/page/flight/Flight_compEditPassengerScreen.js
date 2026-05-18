
import React from 'react';
import {
    View,
    StyleSheet,
    Image,
    TouchableHighlight,
    ScrollView,
    Alert
} from 'react-native';
import SuperView from "../../super/SuperView";
import ViewUtil from '../../util/ViewUtil';
import Util from '../../util/Util';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import HighLight from '../../custom/HighLight';
import CustomeTextInput from '../../custom/CustomTextInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PickerHelper from '../../common/PickerHelper';
import CustomActioSheet from '../../custom/CustomActionSheet';
import I18nUtil from '../../util/I18nUtil';
import ImagePicker from 'react-native-image-picker';
import RNFetchBlob from 'rn-fetch-blob';
import CommonService from '../../service/CommonService';
import GlobalStyles from '../../res/styles/GlobalStyles';
import { Bt_inputView, InfoDicView, SelectView,No_inputView }  from '../../custom/HighLight';
import { connect } from 'react-redux';
// let textInput = React.createRef();
class Flight_compEditPassengerScreen extends SuperView {

    constructor(props) {
        super(props);
        this._enNameToastTs = 0;
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.passenger = Util.Encryption.clone(this.params.passenger || { SexDesc: null, Gender: null });
        this._navigationHeaderView = {
            title: '编辑乘客',
            // rightButton: ViewUtil.getRightButton('保存', this._finishBtnClick),
        }
        let optionArr = [];
        this.passenger.CardTravellerList&&this.passenger.CardTravellerList.map((item)=>{
            if(item.AirPortId){
                optionArr.push(item.AirPortId +" "+item.SerialNumber);
            }
        })
        let additionArr = this.passenger && this.passenger.Addition?this.passenger.Addition: 
                          this.passenger&&this.passenger.AdditionInfo?this.passenger.AdditionInfo:null
        
        const { profileCommonEnum } = this.props;
        let flightBookingConfig = profileCommonEnum?.data?.bookingConfig?.flightBookingConfig;
        let papersOptions = flightBookingConfig?.[0]?.certTypes?.map(item => {
           return Util.Read.typeTocertificate2(item)
        })
        this.state = {
            // papersOptions: ['中国居民身份证', '护照', '台湾通行证', '港澳通行证', '学生证', '军人证', '台湾居民来往大陆通行证', '港澳居民来往内地通行证', '外国人永久居留身份证', '港澳台居民居住证'],
            // papersOptions: ['中国居民身份证', '护照', '学生证', '军人证', '台湾居民来往大陆通行证', '港澳居民来往内地通行证', '外国人永久居留身份证', '港澳台居民居住证','港澳通行证','大陆居民往来台湾通行证','外交部签发的驻华外交人员证','民航局规定的其他有效乘机身份证件'],
            papersOptions: papersOptions,
            // papersOptions: ['身份证', '护照','海员证', '台湾居民来往大陆通行证', '港澳居民来往内地通行证', '外国人永久居留身份证', '港澳台居民居住证'],
            sexOptions: ['男', '女'],
            isEditSerinumber: false,
            isEditMobile:false,
            // 数据字典
            AdditionIfo: additionArr? 
            {
                ...additionArr,
                DictItemList: additionArr.DictItemList ? additionArr.DictItemList : []
            } 
            : 
            {
                DictItemList: []
            },
            customer_info:{},
            select:false,//中文姓名
            selcetName: this.passenger.selcetName ? this.passenger.selcetName : false,
            user_info:{},
            // CardTravellerList:[],//常客卡
            CardTravellerIDArr:optionArr,
            CardTravel1:this.passenger.CardTravel1 || [],//常客卡去程
            CardTravel2:this.passenger.CardTravel2 || [],//常客卡返程
            Country_list:[],
        }
    }

    componentDidMount(){
        this._getCountryList();
    }

    _getCountryList = () => {
        /**
         * 获取国家中英文翻译
         */
        let model = {
            Keyword: ''
        }
        CommonService.getCountryList(model).then(response => {
            if (response.success && response.data) {
                this.setState({
                    Country_list:response.data
                })
            } else {
            this.toastMsg('获取国家数据失败');
            }
        }).catch(error => {
            // this.hideLoadingView();
            // this.toastMsg(error.message || '获取国家数据异常');
        })
    }

    _finishBtnClick = () => {
        const { passenger } = this;
        if(this.state.AdditionIfo){
            passenger.AdditionInfo = this.state.AdditionIfo;
            passenger.Addition = this.state.AdditionIfo;
        }         
        const { index ,goFlightData,customerInfo,backFlightData} = this.params;
        const {CardTravel1,CardTravel2,selcetName} = this.state;
        let issfz = passenger.CertificateType=='身份证' || passenger.CertificateType=='Chinese ID Card';
        let isgatjmjzz = passenger.CertificateType=='港澳台居民居住证' || passenger.CertificateType=='Residence Permit for Hong Kong,Macau and Taiwan Residents';
        let ispassport = passenger.CertificateType=='护照' || passenger.CertificateType=='Passport';
        let issean = passenger.CertificateType=="海员证" || passenger.CertificateType=="Seaman's Book";

        let certType = Util.Read.certificateType2(passenger.CertificateType)
        let CHName = passenger.CertificateType==="身份证" || passenger.CertificateType==="Chinese ID Card" || passenger.CertificateType==="海员证" || passenger.CertificateType==="Seaman's Book"|| passenger.CertificateType==="港澳台居民居住证"|| passenger.CertificateType==="Residence Permit for Hong Kong,Macau and Taiwan Residents"
        let CHName2 = (passenger.CertificateType==="护照" || passenger.CertificateType==="Passport") && passenger.NationalCode==="CN"
        let ENName = (passenger.CertificateType==="护照" || passenger.CertificateType==="Passport")
        let ENName2 = !(passenger.CertificateType==="身份证" || passenger.CertificateType==="Chinese ID Card" ||passenger.CertificateType==="港澳台居民居住证"|| passenger.CertificateType==="Residence Permit for Hong Kong,Macau and Taiwan Residents" || certType === 128)
    
        if (!passenger.Name && ( (CHName || CHName2) || (certType===128 && selcetName) )) {
            this.toastMsg('姓名不能为空');
            return;
        }

        if ((!passenger.Surname && !passenger.LastName) && ( (ENName || ENName2) || (certType===128 && !selcetName) )) {
            this.toastMsg('英文姓不能为空');
            return;
        }
        if(passenger.Surname || passenger.LastName){
            if(Util.RegEx.isEnName(passenger.Surname) || Util.RegEx.isEnName(passenger.LastName)){
                this.toastMsg('英文姓只能输入字母');
                return
            }
        }
        if ((!passenger.GivenName && !passenger.FirstName) && ( (ENName || ENName2) || (certType===128 && !selcetName) )) {
            this.toastMsg('英文名不能为空');
            return;
        }
        if(passenger.GivenName || passenger.FirstName){
            if(Util.RegEx.isEnName(passenger.GivenName) || Util.RegEx.isEnName(passenger.FirstName)){
                this.toastMsg('英文名只能输入字母');
                return
            }
        }
        if(!passenger.CertificateType){
            this.toastMsg('证件类型不能为空');
            return;
        }
        if (Util.Read.certificateType2(passenger.CertificateType) === 1) {
           passenger.NationalCode = 'CN';
           passenger.NationalName = Util.Parse.isChinese() ? '中国' : 'China';
        }
        if (!passenger.CertificateNumber) {
            this.toastMsg('证件号不能为空');
            return;
        }
        if( !issfz ){
            if(!passenger.Birthday){
                this.toastMsg('出生日期不能为空');
                return
            }
            if (!passenger.CertificateExpire && !(passenger.CertificateType=='身份证'||passenger.CertificateType=="Chinese ID Card")) {
                this.toastMsg('请选择证件有效期');
                return;
            }
            if (!passenger.NationalName) {
                this.toastMsg('国籍/地区不能为空');
                return;
            }
            if (!passenger.SexDesc && !passenger.Gender) {
                this.toastMsg('性别不能为空');
                return;
            }
        }
        if(passenger.CertificateType=='外国人永久居留身份证'||passenger.CertificateType=='海员证'||passenger.CertificateType=='护照'){
            let now = new Date();
            if(Util.Date.toDate(passenger.CertificateExpire) > now.setMonth(now.getMonth() + 120)){
                this.toastMsg('证件有效期大于10年');
                return;
            }
            if(Util.Date.toDate(passenger.CertificateExpire) < Util.Date.toDate(goFlightData.DepartureTime)){
                this.toastMsg('航班出发日期超过证件有效期');
                return;
            }
           
        }
        if (passenger?.CertificateExpire&&passenger?.CertificateExpire?.includes('T')) {
            //    passenger.CertificateExpire += 'T00:00:00';
            passenger.CertificateExpire = Util.Date.toDate(passenger.CertificateExpire).format('yyyy-MM-dd');
        }
        if (!passenger.Mobile) {
            this.toastMsg('手机号不能为空');
            return;
        } else {
            if (!Util.RegEx.isMobile(passenger.Mobile)) {
                this.toastMsg('手机号格式不正确');
                return;
            }
        }
        let CardTravellerArr = [{},{}]
        if(CardTravel1&&CardTravel1.length>0){
            // if(goFlightData.AirCode != CardTravel1[0].AirPortId){
            //    this.toastMsg('您选择的去程常旅客卡号与订票航司不符，请重新选择');
            //    return;
            // }
            passenger.CardTravel1 = CardTravel1
            if(backFlightData){
                CardTravel1.map((item)=>{
                    CardTravellerArr[0]= item
                })
            }else{
                passenger.TravallerCard = CardTravel1;
            }
        }else{
            passenger.CardTravel1 = null
        }
        if(CardTravel2&&CardTravel2.length>0){
            if(backFlightData){
                // if(backFlightData.AirCode != CardTravel2[0].AirPortId){
                //     this.toastMsg('您选择的返程常旅客卡号与订票航司不符，请重新选择');
                //     return;
                //  }
                passenger.CardTravel2 = CardTravel2
                CardTravel2.map((item)=>{
                    CardTravellerArr[1]= item
                }) 
                passenger.TravallerCard = CardTravellerArr;
            }   
        }else{
            passenger.CardTravel2 = null
        }
        // if (passenger.Birthday && !passenger.Birthday.includes('T')) {
        //     passenger.Birthday += 'T00:00:00';
        // }
        if(!passenger.Email && customerInfo&&customerInfo.EmailRequired){
            this.toastMsg('邮箱不能为空');
            return;
        }
        if (passenger.Email && !Util.RegEx.isEmail(passenger.Email)) {
            this.toastMsg('请输入正确的邮箱格式');
            return;
        }
        if (customerInfo&&customerInfo.EmployeeDictList) {
            for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                const obj = customerInfo.EmployeeDictList[i];
                let dicItem = passenger.AdditionInfo&&passenger.AdditionInfo.DictItemList&&passenger.AdditionInfo.DictItemList.find(item => 
                    // obj.NeedInput ? item.DictName === obj.Name : item.DictId === obj.Id
                    item.DictCode === obj.Code
                );
                if (obj.IsRequire && obj.ShowInOrder) {
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
            passenger.selcetName = selcetName;
            this.params.callBack(passenger);
            this.pop();
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
    _handlePress = (index) => {
        const { papersOptions } = this.state;
        if (this.passenger.CertificateType !== papersOptions[index]) {
            this.passenger.CertificateType = papersOptions[index];
            if(Util.Read.certificateType2(this.passenger.CertificateType) === 1){
                this.passenger.NationalCode = 'CN';
                this.passenger.NationalName = Util.Parse.isChinese() ? '中国' : 'China';
                this.passenger.NationalityCode = 'CN';
                this.passenger.Nationality = Util.Parse.isChinese() ? '中国' : 'China';
            }
            this.passenger.CertificateNumber = '';
            this.passenger.Expire = '';
            this.passenger.IssueNationName = '';
            this.passenger.IssueNationCode = '';
            this.passenger.CertificateExpire = '';
            let obj;
            if (this.passenger.Certificate  && typeof(this.passenger.Certificate) === 'string') {
                let CertificateList = JSON.parse(this.passenger.Certificate) || [];
                let Type = Util.Read.certificateType2(this.passenger.CertificateType)
                obj = CertificateList&&CertificateList.find(item => item.Type == Type );
            }
            if(this.passenger.Certificates){
                let Type = Util.Read.certificateType2(this.passenger.CertificateType)
                obj = this.passenger.Certificates.find(item => item.Type == Type );
            }
            if (obj) {
                    this.passenger.CertificateNumber = obj.SerialNumber;
                    this.passenger.Expire = obj.Expire;
                    this.passenger.IssueNationName = obj.IssueNationName;
                    this.passenger.IssueNationCode = obj.IssueNationCode;
                    this.passenger.CertificateExpire = obj.Expire
            }
        }
        // textInput.current._root.focus();
        this.setState({});
    }
    _handlePressCardTravle = (_index) => {
        let arr = [];
        if(_index != 'cancel'){
            this.passenger.CardTravellerList&&this.passenger.CardTravellerList.map((item,index)=>{
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
    _handlePressCardTravle2 = (_index) => {
        let arr = [];
        if(_index != 'cancel'){
            this.passenger.CardTravellerList&&this.passenger.CardTravellerList.map((item,index)=>{
                if(index==_index){
                    arr.push(item)
                    this.setState({
                        CardTravel2:arr
                    })
                }
            })
        }else{
            this.setState({
                CardTravel2:null
            })
        }
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
    _pickerExpire = () => {
        PickerHelper.create(PickerHelper.createYYYYMMDDDate(), new Date(), (data) => {
            this.passenger.CertificateExpire = data.join('-');
            this.setState({});
        })
    }

    _changeName = () => {
        this.setState({
            selcetName: !this.state.selcetName,
        })
    }
    renderBody() {
        const { index, customerInfo,goFlightData,backFlightData } = this.params;      
        const { passenger } = this;
        if (!passenger) {
            return null;
        }
        const { profileCommonEnum } = this.props;
        let flightBookingConfig = profileCommonEnum?.data?.bookingConfig?.flightBookingConfig;
        const { isEditSerinumber, isEditMobile, AdditionIfo,CardTravellerIDArr,CardTravel1,CardTravel2,sexOptions,Country_list,selcetName} = this.state;
        if (passenger.Birthday) {
            if (passenger.Birthday === '0001-01-01T00:00:00') {
                passenger.Birthday = '';
            } else {
                // passenger.Birthday = Util.Date.toDate(passenger.Birthday).format('yyyy-MM-dd');
                const dateObj = Util.Date.toDate(passenger.Birthday);
                if (dateObj && typeof dateObj.format === 'function') {
                    passenger.Birthday = dateObj.format('yyyy-MM-dd');
                } else {
                    passenger.Birthday = ''; // 或保持原值
                }
            }
        }
        if (passenger.CertificateExpire && typeof passenger.CertificateExpire === 'string' && passenger.CertificateExpire.includes('T')) {
            // passenger.CertificateExpire = Util.Date.toDate(passenger.CertificateExpire).format('yyyy-MM-dd');
            const dateObj = Util.Date.toDate(passenger.CertificateExpire);
            if (dateObj && typeof dateObj.format === 'function') {
                passenger.CertificateExpire = dateObj.format('yyyy-MM-dd');
            }else{
                passenger.CertificateExpire = ''; // 或保持原值
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
                const dateObj = Util.Date.toDate(str);
                if (dateObj && typeof dateObj.format === 'function') {
                    passenger.Birthday = dateObj.format('yyyy-MM-dd');
                } else {
                    passenger.Birthday = ''; // 或保持原值
                }
            }
        }
        // const config = flightBookingConfig.find(c => {
        //     const currentNation = c.nation;
        //     const passengerNation = passenger.NationalCode;
        //     return (
        //       currentNation === passengerNation ||
        //       (!['CN','HK','MO','TW'].includes(passengerNation) && currentNation === '_') 
        //       ||
        //       (currentNation === "" && !passengerNation)
        //     );
        //   });
        // let certTypes = config?.certTypes?.map(item => {
        //    return Util.Read.typeTocertificate2(item)
        // })
        
        // 如果passenger.CertificateType不在certTypes中,默认显示身份证
        let certType = Util.Read.certificateType2(passenger.CertificateType)
        if(!flightBookingConfig?.[0]?.certTypes.includes(certType)){
            passenger.CertificateType = Util.Parse.isChinese() ? '身份证' : 'Chinese ID Card';
        }
        let CHName = passenger.CertificateType==="身份证" || passenger.CertificateType==="Chinese ID Card" || passenger.CertificateType==="海员证" || passenger.CertificateType==="Seaman's Book"|| passenger.CertificateType==="港澳台居民居住证"|| passenger.CertificateType==="Residence Permit for Hong Kong,Macau and Taiwan Residents"
        let CHName2 = (passenger.CertificateType==="护照" || passenger.CertificateType==="Passport") && passenger.NationalCode==="CN"
        let ENName = (passenger.CertificateType==="护照" || passenger.CertificateType==="Passport")
        let ENName2 = !(passenger.CertificateType==="身份证" || passenger.CertificateType==="Chinese ID Card" ||passenger.CertificateType==="港澳台居民居住证"|| passenger.CertificateType==="Residence Permit for Hong Kong,Macau and Taiwan Residents")
        let nationalzhName = '';
        Country_list?.map(item => {
            if(item.Code === passenger.NationalCode){
                nationalzhName = Util.Parse.isChinese() ? item.Name : item.EnName
            }
        })
        //passenger.LastName || passenger.Surname 不符合/[^a-zA-Z'\s]/g时
        if(passenger.Surname && Util.RegEx.isEnName(passenger.Surname)){
            passenger.Surname = '';
        }
        if(passenger.LastName && Util.RegEx.isEnName(passenger.LastName)){
            passenger.LastName = '';
        }
        if(passenger.FirstName && Util.RegEx.isEnName(passenger.FirstName)){
            passenger.FirstName = '';
        }
        if(passenger.GivenName && Util.RegEx.isEnName(passenger.GivenName)){
            passenger.GivenName = '';
        }
        return (
            <View style={{ flex:1}}>
            {
                ViewUtil.getNameTips()
            }
            <ScrollView style={GlobalStyles.keyViewSy} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps='handled'>
                {
                    index === 1 ?
                      ViewUtil.getNameTips2()
                    : null
                }
                { 
                    CHName || CHName2 || (certType === 128 && selcetName) ?
                        <View style={[styles.row,{borderBottomColor:passenger.Name? Theme.lineColor:Theme.redColor}]}>
                            <HighLight  name={'姓名'} value={passenger.Name} style={{color:Theme.commonFontColor, fontSize:14}}/>
                            <CustomeTextInput style={{ flex: 5,marginLeft:15 }} value={passenger.Name} onChangeText={text => { passenger.Name = text; this.setState({}) }} placeholder='须与登机证件姓名一致' />
                            {
                                certType === 128 ?
                                <TouchableHighlight underlayColor='transparent' onPress={this._changeName}>
                                    <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                        <View style={{ backgroundColor: selcetName ? Theme.theme : Theme.aidFontColor, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }}>
                                            <CustomText text='中' style={{ color: '#fff'}} />
                                        </View>
                                        <View style={{ backgroundColor: !selcetName ? Theme.theme : Theme.aidFontColor, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopRightRadius: 3, borderBottomRightRadius: 3 }}>
                                            <CustomText text='EN' style={{ color: '#fff'}} />
                                        </View>
                                    </View>
                                </TouchableHighlight> : null
                            }
                        </View>
                    : null
                }
                {
                   (ENName || ENName2) && !(certType === 128 && selcetName) ? 
                   <View>
                         <View style={styles.row}>
                                <View style={{flex:4,flexDirection:'row'}}>
                                    <View style={{flexDirection:'column'}}>
                                    <CustomText text='姓（拼音）' style={{fontSize:14,color:Theme.commonFontColor}}/>
                                    <CustomText text='Surname' />
                                    </View>
                                    <CustomText text={'*'} style={{  color:'red',fontSize:18,marginTop:3}} />
                                </View>
                                <View style={{ flex: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                                    <CustomeTextInput style={[styles.input, { flex: 1 }]} placeholder={'须与登机证件姓一致'} 
                                    value={/[^a-zA-Z'\s]/.test(passenger.LastName || passenger.Surname || '') ? '' : (passenger.LastName || passenger.Surname || '')} onChangeText={text => {
                                        if (!text || !Util.RegEx.isEnName(text)) {
                                            passenger.LastName = text;
                                            passenger.Surname = text;
                                            this.setState({});
                                            return;
                                        }
                                        const now = Date.now();
                                        if (now - this._enNameToastTs > 800) {
                                            this._enNameToastTs = now;
                                            this.toastMsg('英文姓只能输入字母');
                                        }
                                    }} />
                                    {
                                        certType === 128 ?
                                        <TouchableHighlight underlayColor='transparent' onPress={this._changeName}>
                                            <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                                <View style={{ backgroundColor: selcetName ? Theme.theme : Theme.aidFontColor, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }}>
                                                    <CustomText text='中' style={{ color: "white" }} />
                                                </View>
                                                <View style={{ backgroundColor: !selcetName ? Theme.theme : Theme.aidFontColor, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopRightRadius: 3, borderBottomRightRadius: 3 }}>
                                                    <CustomText text='EN' style={{ color: "white" }} />
                                                </View>
                                            </View>
                                        </TouchableHighlight>:null
                                    }
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={{flexDirection:'row' ,flex:4}}>
                                    <View style={{flexDirection:'column'}}>
                                    <CustomText text='名（拼音）' style={{fontSize:14,color:Theme.commonFontColor}}/>
                                    <CustomText text='Given name' />
                                    </View>
                                    <CustomText text={'*'} style={{  color:'red',fontSize:18,marginTop:3}} />
                                </View>
                                <CustomeTextInput style={styles.input} 
                                    value={
                                        /[^a-zA-Z'\s]/.test(passenger.FirstName || passenger.GivenName || '') ? '' : (passenger.FirstName || passenger.GivenName || '')
                                    } 
                                    placeholder={'须与登机证件名一致'} onChangeText={text => {
                                    if (!text || !Util.RegEx.isEnName(text)) {
                                        passenger.FirstName = text;
                                        passenger.GivenName = text;
                                        this.setState({});
                                        return;
                                    }
                                    const now = Date.now();
                                    if (now - this._enNameToastTs > 800) {
                                        this._enNameToastTs = now;
                                        this.toastMsg('英文名只能输入字母');
                                    }
                                }} />
                            </View>
                    </View>
                    :null
                }
                <SelectView titleName={'证件类型'}
                            required={false}
                            _selectName={Util.Read.certificateTransfer(passenger.CertificateType)}
                            _placeholder={''} 
                            _callBack={()=>{
                                this.setState({ 
                                    papersOptions: this.state.papersOptions
                                });
                                // this.ActionSheet.show();
                                if (this && this.ActionSheet && typeof this.ActionSheet.show === 'function') {
                                    try {
                                        this.ActionSheet.show();
                                    } catch (error) {
                                        console.error('ActionSheet失败:', error);
                                    }
                                }
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
                    passenger.CertificateType=='身份证' || passenger.CertificateType=='Chinese ID Card'?
                    null
                    :
                    <View>
                        <SelectView titleName={'有效期至'}
                                    required={true}
                                    _selectName={passenger.CertificateExpire}
                                    _placeholder={''} 
                                    _callBack={()=>{
                                        this._pickerExpire()
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
                        <SelectView titleName={'性别'}
                                    required={true}
                                    _selectName={passenger.Gender==2?'女':passenger.Gender==1?'男':null}
                                    _placeholder={'请选择性别'} 
                                    _callBack={()=>{
                                    // this.GenderActionSheet.show();
                                        if (this?.GenderActionSheet?.show) {
                                            try { this.GenderActionSheet.show(); } catch(e) {}
                                        }
                                    }}
                        />
                        <SelectView titleName={'出生日期'}
                                    required={(passenger.CertificateType=='身份证' || passenger.CertificateType=='港澳台居民居住证'||
                                        passenger.CertificateType=='Chinese ID Card' || passenger.CertificateType=='Residence Permit for Hong Kong,Macau and Taiwan Residents') 
                                        &&((goFlightData&&goFlightData.SupplierType==1 && !backFlightData)||(goFlightData&&goFlightData.SupplierType==1 && backFlightData&&backFlightData.SupplierType==1)) ? false : true}
                                    _selectName={passenger.Birthday}
                                    _placeholder={'请选择出生日期'} 
                                    _callBack={()=>{
                                        this._pickerShow();
                                    }}
                        />
                    </View>
                }
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
                
                <Bt_inputView dicKey={'E-mail'} 
                                  bt_text={passenger.Email} 
                                  _placeholder={customerInfo&&customerInfo.EmailRequired?'邮箱(必填)':'邮箱(选填)'} 
                                  _callBack={(text)=>{
                                         passenger.Email = text; 
                                         this.setState({}) 
                                  }}
                                  required={customerInfo&&customerInfo.EmailRequired ? true : false}
                />                    
                {
                    this.params.title=='新增乘客' || !(this.passenger.CardTravellerList&&this.passenger.CardTravellerList.length>0) ? null:
                        <SelectView titleName={'去程常客卡'}
                                    required={false}
                                    _selectName={ CardTravel1&&CardTravel1[0]?CardTravel1[0].AirPortId+" "+CardTravel1[0].SerialNumber:null }
                                    _callBack={()=>{
                                        // this.CardTravellerActionSheet.show();
                                        if (this?.CardTravellerActionSheet?.show) {
                                            try { this.CardTravellerActionSheet.show(); } catch(e) {}
                                        }
                                    }}
                        />
                }
                {
                  !backFlightData || !(this.passenger.CardTravellerList&&this.passenger.CardTravellerList.length>0)?null:
                        <SelectView titleName={'返程常客卡'}
                                    required={false}
                                    _selectName={ CardTravel2&&CardTravel2[0]?CardTravel2[0].AirPortId+" "+CardTravel2[0].SerialNumber:null }
                                    _callBack={()=>{
                                        // this.CardTravellerActionSheet2.show();
                                        if (this?.CardTravellerActionSheet2?.show) {
                                            try { this.CardTravellerActionSheet2.show(); } catch(e) {}
                                        }
                                    }}
                        />
                }
                <CustomActioSheet ref={o => this.ActionSheet = o} options={this.state.papersOptions} onPress={this._handlePress} />
                <CustomActioSheet ref={o => this.CardTravellerActionSheet = o} options={CardTravellerIDArr} onPress={this._handlePressCardTravle} />
                <CustomActioSheet ref={o => this.CardTravellerActionSheet2 = o} options={CardTravellerIDArr} onPress={this._handlePressCardTravle2} />
                <CustomActioSheet ref={o => this.GenderActionSheet = o} options={sexOptions} onPress={this._selectSex} />
                {
                     customerInfo&&customerInfo.EmployeeDictList && customerInfo.EmployeeDictList.length > 0 ?
                     customerInfo.EmployeeDictList.map((obj, index) => {
                         let itemIndex;
                        //  if(obj.BusinessCategory&128){
                            itemIndex = AdditionIfo&&AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(
                                item => item.DictCode === obj.Code
                            );
                            if(itemIndex){
                                itemIndex.DictName = obj.Name
                                itemIndex.DictEnName = obj.EnName
                                itemIndex.DictId = obj.Id
                            }
                            if(!itemIndex){
                                itemIndex = obj
                                itemIndex.DictName = obj.Name
                            }
                        //  } 
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
                            //      {obj.IsRequire?<HighLight name={itemIndex.DictName} />:<CustomText text={obj.Name} style={{ flex: 3 }} />}
                            //      {
                            //          obj.NeedInput ?
                            //              <View style={{backgroundColor:obj.IsRequire&& !(itemIndex && itemIndex.ItemName)?'#F7CCD1':'#fff',height:38,flex: 7,justifyContent:'center'}}>
                            //                 <CustomeTextInput style={{ flex: 7 }} value={itemIndex && itemIndex.ItemName} placeholder={obj.Remark} editable={obj.IsEditInput} onChangeText={(text) => {
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
            </ScrollView>
            {
                ViewUtil.getThemeButton('保存', this._finishBtnClick)
            }
            </View>
        )
    }
    _toSelectCounty = (passenger) => {
        const { profileCommonEnum } = this.props;
        let flightBookingConfig = profileCommonEnum?.data?.bookingConfig?.flightBookingConfig;
        this.push('NationalCity', {
            refresh: (item) => {
                const config = flightBookingConfig.find(c => 
                    c.nation === item.Code || 
                    (item.Code !== 'CN' && item.Code !== 'HK' && item.Code !== 'MO' && item.Code !== 'TW' && c.nation === '_')
                );
                let certType = Util.Read.certificateType2(this.passenger.CertificateType)
                // if (config && !config.certTypes.includes(certType)) {
                    const changeRule = config.checkChange?.find(r => r.certType === certType);
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
                // }
                // else if(config && config.certTypes.includes(certType)){
                //     const changeRule = config.checkChange?.find(r => r.certType === certType);
                //     let title = Util.Parse.isChinese() ? '温馨提示' : 'Warm tip';
                //     if (changeRule) {
                //         Alert.alert(
                //             title,
                //             changeRule.message,
                //             [{
                //                 text: Util.Parse.isChinese() ? '确定' : 'OK',
                //                 onPress:() => this.handleCertTypeChange(changeRule.changeCertType)
                //             }]
                //         );
                //     }
                // }
                passenger.NationalCode = item.Code;
                this.passenger.NationalName = item.Name;
                this.passenger.Nationality = item.Name;
                this.passenger.NationalityCode = item.Code;
                this.passenger.IssueNationCode = item.Code;
                this.passenger.IssueNationName = item.Name;
                this.setState({
                });
            },
            // CertificateType:passenger.CertificateType
        });
        
    }
    handleCertTypeChange = (newCertType) => {
        if (!this.passenger) {
            return;
        }
        this.passenger.CertificateType = Util.Read.typeTocertificate2(newCertType);
        let CertificateItem = null;
        if (Array.isArray(this.passenger.Certificates)) {
            CertificateItem = this.passenger.Certificates.find(item => item.Type == newCertType);
        }
        this.passenger.CertificateNumber =  CertificateItem?.SerialNumber || ''
        this.passenger.CertificateExpire =  CertificateItem?.Expire || ''
        this.passenger.Expire =  CertificateItem?.Expire || ''
        this.setState(prevState => ({
            passenger: {
                ...(prevState.passenger || {}),
                CertificateType: this.passenger.CertificateType,
                CertificateNumber:this.passenger.CertificateNumber,
                CertificateExpire: this.passenger.CertificateExpire,
                Expire: this.passenger.Expire
            }
        }));
    };  
    _valueCHange = (text, obj) => {
        const { AdditionIfo } = this.state;
        let itemIndex = AdditionIfo&&AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
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
            title: obj.Name,
            Id: obj.Id,
            callBack: (data) => {
                let dic = AdditionIfo&&AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
                if (dic) {
                    dic.ItemId = data.Id;
                    dic.ItemSerialNumber = data.SerialNumber;
                    dic.ItemInput = `${data.SerialNumber} - ${data.Name} - ${data.EnName}`;
                    dic.ItemName = data.Name;
                    dic.EnName = data.EnName
                    // dic.RemarkNo = data.RemarkNo
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
const getStatusProps = state => ({
    profileCommonEnum: state.profileCommonEnum,   
})
export default connect(getStatusProps)(Flight_compEditPassengerScreen);
const styles = StyleSheet.create({

    row: {
        flexDirection: 'row',
        height: 50,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        alignItems: 'center',
        backgroundColor: 'white', 
        marginTop:1
    },
    row1: {
        flexDirection: 'row',
        height: 40,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 10,
    }
    , right: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 7,
    },
    text: {
        flex: 3,
    },
    input: {
        flex: 7,
        marginLeft:-10
    },
    rowRight: {
        flex: 7,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    }
})
