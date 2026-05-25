import React from 'react';
import {
    View, TouchableHighlight, StyleSheet, Alert
} from 'react-native';
import SuperView from '../../super/SuperView';
import ViewUtil from '../../util/ViewUtil';
import Util from '../../util/Util';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import CustomeTextInput from '../../custom/CustomTextInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PickerHelper from '../../common/PickerHelper';
import CustomActioSheet from '../../custom/CustomActionSheet';
import AntDesign from 'react-native-vector-icons/AntDesign';
import HighLight from '../../custom/HighLight';
import I18nUtil from '../../util/I18nUtil';
import GlobalStyles from '../../res/styles/GlobalStyles';
import { Bt_inputView, InfoDicView, SelectView,No_inputView }  from '../../custom/HighLight';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { connect } from 'react-redux';
import StorageUtil from '../../util/StorageUtil';
import Key from '../../res/styles/Key';

// let textInput = React.createRef();
class TrainComp_EditPassengerScreen extends SuperView {
    constructor(props) {
        super(props);
        this._enNameToastTs = 0;
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.passenger = Util.Encryption.clone(this.params.passenger || { Gender: 1 ,CertificateType:'身份证'});
        this._navigationHeaderView = {
            title: '编辑乘客',
            // rightButton: ViewUtil.getRightButton('保存', this._finishBtnClick)
        }
        let additionArr = this.passenger && this.passenger.Addition?this.passenger.Addition: 
                          this.passenger&&this.passenger.AdditionInfo?this.passenger.AdditionInfo:null
        const { profileCommonEnum } = this.props;
        let trainBookingConfig = profileCommonEnum?.data?.bookingConfig?.trainBookingConfig;
        let certTypes = trainBookingConfig?.[0]?.certTypes?.map(item => {
           return Util.Read.typeTocertificate2(item)
        })
        this.state = {
            papersOptions: certTypes,
            // papersOptions: ['身份证', '护照', '港澳台居民居住证', '外国人永久居留身份证', '台湾居民来往大陆通行证', '港澳居民来往内地通行证'],
            sexOptions: ['男', '女'],
            isEditSerinumber: false,
            isEditMobile:false,
             // 数据字典
            AdditionIfo: 
               this.params.noComp ?
                (this.passenger && this.passenger.AdditionInfo && this.passenger.AdditionInfo ? {
                    ...this.passenger.AdditionInfo,
                    DictItemList: this.passenger.AdditionInfo.DictItemList ? this.passenger.AdditionInfo.DictItemList : []
                } : {
                    DictItemList: []
                })
                :
                (additionArr ? {
                    ...additionArr,
                    DictItemList: additionArr.DictItemList ? additionArr.DictItemList : []
                } : {
                    DictItemList: []
                }),
                select:this.passenger.selectEn?this.passenger.selectEn:false,
                Country_list:[],
        }
    }

    componentDidMount() {
        StorageUtil.loadKey(Key.CountryTrans).then(responseCounty =>{
            this.setState({
                Country_list:responseCounty
            })
        })
    }

    _finishBtnClick = () => {
        const { passenger } = this;
        const { customerInfo } = this.params;
        const {select} = this.state
        passenger.Addition = this.state.AdditionIfo;
        if (customerInfo.EmployeeDictList) {
            for (let i = 0; i < customerInfo.EmployeeDictList.length; i++) {
                const obj = customerInfo.EmployeeDictList[i];
                let dicItem = passenger.Addition.DictItemList&&passenger.Addition.DictItemList.find(dic => dic.DictId === obj.Id);
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
        let ENName = Util.Read.certificateType2(passenger.CertificateType) === 1024 || (Util.Read.certificateType2(passenger.CertificateType) === 2 && passenger.NationalCode!=="CN")
        let ENName1 = Util.Read.certificateType2(passenger.CertificateType) === 128 && select

        if (!passenger.Name && Util.Read.certificateType2(passenger.CertificateType) != 1024 && !ENName1) {
            this.toastMsg('姓名不能为空');
            return;
        }
        if ((!passenger.Surname && !passenger.LastName) && (ENName || ENName1)) {
            this.toastMsg('英文姓不能为空');
            return;
        }
        if(passenger.Surname || passenger.LastName){
            let EnglishName = passenger.Surname || passenger.LastName
            if(Util.RegEx.isEnName(EnglishName)){
                this.toastMsg('英文姓只能包含字母');
                return;
            }
        }
        if ((!passenger.GivenName && !passenger.FirstName) && (ENName || ENName1)) {
            this.toastMsg('英文名不能为空');
            return;
        }
        if(passenger.GivenName || passenger.FirstName){
            let EnglishName = passenger.FirstName || passenger.GivenName
            if(Util.RegEx.isEnName(EnglishName)){
                this.toastMsg('英文名只能包含字母');
                return;
            }
        }
        if(ENName1 || ENName){
            passenger.Name = passenger.Surname +'/'+ passenger.GivenName
        }
        if(ENName1){
            passenger.selectEn = true;
        }else{
            passenger.selectEn = false;
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
        if(!passenger.CertificateType){
            this.toastMsg('证件类型不能为空');
            return;
        }
        if (!passenger.CertificateNumber) {
            this.toastMsg('证件号不能为空');
            return;
        }
        if (Util.Read.certificateType2(passenger.CertificateType) != 1 ) {
            // if(this.params.noComp){
            //     if(!passenger.Nationality && passenger.NationalityCode){
            //         this.toastMsg('国家地区不能为空');
            //     }
            // }else{
            //     if(!passenger.NationalName && passenger.NationalityCode){
            //         this.toastMsg('国家地区不能为空');
            //     }
            // }
            if(!passenger.NationalName || !passenger.NationalCode){
                this.toastMsg('国家地区不能为空');
                return;
            }
            if (!passenger.Birthday) {
                this.toastMsg('出生日期不能为空');
                return;
            }
            if (!passenger.Expire) {
                this.toastMsg('证件有效期不能为空');
                return;
            }
            if (!passenger.SexDesc&&!passenger.Gender) {
                this.toastMsg('性别不能为空');
                return;
            }
        }else{
            passenger.NationalCode = 'CN';
            passenger.NationalName =Util.Parse.isChinese() ? '中国' : 'China';
        }
        if(!passenger.Email && customerInfo.EmailRequired){
            this.toastMsg('邮箱不能为空');
            return;
        }
        if(passenger.Email && !Util.RegEx.isEmail(passenger.Email)) {
            this.toastMsg('请输入正确的邮箱格式');
            return;
        }
        // if (passenger.Birthday && passenger.Birthday.includes('T')) {
        //     passenger.Birthday += 'T00:00:00';
        // }
        // if (passenger.Expire && !passenger.Expire.includes('T')) {
        //     passenger.Expire += 'T00:00:00';
        // }
            this.params.callBack(passenger);
            this.pop();  
    }
    componentWillUnmount() {
        super.componentWillUnmount();
        if (PickerHelper && typeof PickerHelper.hide === 'function') {
            PickerHelper.hide();
        }
    }
    /**
     *  index 1是出生日期 2是有效期
     */
    _pickerShow = (index) => {
        let date = index===1?null: new Date()
        PickerHelper.create(PickerHelper.createYYYYMMDDDate(), date, (data) => {
            if (index === 1) {
                this.passenger.Birthday = data.join('-');
            } else {
                this.passenger.Expire = data.join('-');
            }
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
            this.passenger.CertificateExpire = '';

            let obj ;
            if (this.passenger.Certificate  && typeof(this.passenger.Certificate) === 'string') {
                try {
                    let CertificateList = JSON.parse(this.passenger.Certificate) || [];
                    let Type = Util.Read.certificateType2(this.passenger.CertificateType)
                    obj = CertificateList&&CertificateList.find(item => item.Type == Type );
                } catch (error) {
                    console.error('JSON.parse error in _handlePress:', error);
                    CertificateList = [];
                }
            }
            if(this.passenger.Certificates){
                let Type = Util.Read.certificateType2(this.passenger.CertificateType)
                obj = this.passenger.Certificates.find(item => item.Type == Type );
            }
            if (obj) {
                this.passenger.CertificateNumber =  obj.SerialNumber;
                this.passenger.Expire = obj.Expire;
            }
        }
        this.setState({});
    }
    /**
     *  选择性别
     */
    _selectSex = (index) => {
        if (index === 1) {
            this.passenger.Gender = 2;
        } else {
            this.passenger.Gender = 1;
        }
        this.setState({});
    }
    _alertTip = () => {
        this.showAlertView(Util.Parse.isChinese() ? trainNameNotice : trainNameEnNotice);
    }
    /**
     *  选择国家
     */
    _toSelectCounty = () => {
        const { profileCommonEnum } = this.props;
        let trainBookingConfig = profileCommonEnum?.data?.bookingConfig?.trainBookingConfig;
        this.push('NationalCity', {
            refresh: (item) => {
                const config = trainBookingConfig.find(c => 
                    c.nation === item.Code || 
                    (item.Code !== 'CN' && item.Code !== 'HK' && item.Code !== 'MO' && item.Code !== 'TW' && c.nation === '_')
                );
                let certType = Util.Read.certificateType2(this.passenger.CertificateType)
                if (config && !config.certTypes.includes(certType)) {
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
                }

                 if(this.params.noComp){
                     this.passenger.NationalityCode = item.Code;
                     this.passenger.Nationality = item.Name;
                 }else{
                    this.passenger.NationalCode = item.Code;
                    this.passenger.NationalName = item.Name;
                    this.passenger.NationalityCode = item.Code;
                     this.passenger.Nationality = item.Name;
                 }
                this.setState({
                });
            }
        });
    }
    handleCertTypeChange = (newCertType) => {
        this.passenger.CertificateType = Util.Read.typeTocertificate2(newCertType);
        let CertificateItem ;
        if (Array.isArray(this.passenger.Certificates)) {
            this.passenger.Certificates?.filter(item => {
                if(item.Type == newCertType){
                    CertificateItem = item;
                }
            });
        }
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
    };   
    renderBody() {
        const { index,customerInfo,noComp } = this.params;
        const { passenger } = this;
        const {select} = this.state
        const { profileCommonEnum } = this.props;
        let trainBookingConfig = profileCommonEnum?.data?.bookingConfig?.trainBookingConfig;
        const { isEditSerinumber ,isEditMobile,AdditionIfo,sexOptions,Country_list} = this.state;
        if (passenger.Birthday) {
            if (passenger.Birthday === '0001-01-01T00:00:00') {
                passenger.Birthday = '';
            } else {
                passenger.Birthday = Util.Date.toDate(passenger.Birthday).format('yyyy-MM-dd');
            }
        }
        if (passenger.Expire) {
            if (passenger.Expire === '0001-01-01T00:00:00'|| passenger.Expire === "NaN-aN-aNT00:00:00"|| passenger.Expire === "Invalid date") {
                passenger.Expire = '';
            } else {
                passenger.Expire = Util.Date.toDate(passenger.Expire).format('yyyy-MM-dd');
            }
        } else if (passenger.CertificateExpire) {
            if (passenger.CertificateExpire === '0001-01-01T00:00:00'|| passenger.CertificateExpire === "NaN-aN-aNT00:00:00"|| passenger.CertificateExpire === "Invalid date") {
                passenger.Expire = '';
            } else {
                passenger.Expire = passenger.CertificateExpire.replace("T00:00:00", " ")
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
        let nocomp_national = passenger.NationalityCode&&passenger.Nationality ? passenger.Nationality : ''
        let comp_national = passenger.NationalCode&&passenger.NationalName ? passenger.NationalName : ''

        // // 根据国家代码匹配证件类型
        // const config = trainBookingConfig.find(c => {
        //     const currentNation = c.nation;
        //     const passengerNation = passenger.NationalCode;
        //     return (
        //       currentNation === passengerNation || (!passengerNation && currentNation === '') ||
        //       (!['CN','HK','MO','TW'].includes(passengerNation) && currentNation === '_')
        //     );
          
        //   });
        // let certTypes = config?.certTypes?.map(item => {
        //    return Util.Read.typeTocertificate2(item)
        // })
        // let certTypes = trainBookingConfig?.[0]?.certTypes?.map(item => {
        //    return Util.Read.typeTocertificate2(item)
        // })
        let certType = Util.Read.certificateType2(passenger.CertificateType)
        if(!trainBookingConfig?.[0]?.certTypes?.includes(certType)){
            passenger.CertificateType = Util.Parse.isChinese() ? '身份证' : 'Chinese ID Card';
        }
        let nationalzhName = '';
        let NaCode = noComp ? passenger.NationalityCode : passenger.NationalCode
        Country_list?.map(item => {
            if( item.Code === NaCode){
                nationalzhName = Util.Parse.isChinese() ? item.Name : item.EnName
            }
        })
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
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" style={GlobalStyles.keyViewSy} showsVerticalScrollIndicator={false}>
                {
                    index === 1 ?
                        ViewUtil.getNameTips2()
                    : null
                }
                {
                   Util.Read.certificateType2(passenger.CertificateType) === 128 || passenger.CertificateType === '外国人永久居留身份证' || (Util.Read.certificateType2(passenger.CertificateType) === 2 && passenger.NationalCode !== 'CN') ? null:
                    <Bt_inputView dicKey={'姓名'} 
                                    required={true}
                                    bt_text={passenger.Name} 
                                    _placeholder={'证件上的真实姓名'} 
                                    _callBack={(text)=>{
                                        passenger.Name = text;
                                        this.setState({});
                                    }}
                        />
                }
                { 
                  Util.Read.certificateType2(passenger.CertificateType) === 1024|| (Util.Read.certificateType2(passenger.CertificateType) === 2 && passenger.NationalCode !== 'CN') ?
                        <View>
                            <Bt_inputView dicKey={'英文姓'}
                                        required={true} 
                                        bt_text={passenger.LastName|| passenger.Surname} 
                                        _placeholder={'姓氏'} 
                                        warm_text={'需与证件一致'} 
                                        _callBack={(text)=>{
                                            passenger.LastName = text;
                                            passenger.Surname = text;
                                            this.setState({});
                                        }}
                                        isEnName={true}
                            />
                            <Bt_inputView dicKey={'英文名'}
                                        required={true} 
                                        bt_text={passenger.FirstName || passenger.GivenName} 
                                        _placeholder={'名'} 
                                        warm_text={'需与证件一致'} 
                                        _callBack={(text)=>{
                                            passenger.FirstName = text;
                                            passenger.GivenName = text;
                                            this.setState({});
                                        }}
                                        isEnName={true}
                            />
                        </View>
                    :
                    null
                }
                {//国籍NationalCode是中国、澳门、香港、台湾时默认需要填写
                    Util.Read.certificateType2(passenger.CertificateType) === 128 && !select     
                    ?
                    <View style={[styles.row,{borderBottomColor:passenger.Name? Theme.lineColor:Theme.redColor,paddingHorizontal:1}]}>
                        <HighLight  name={'姓名'} value={passenger.Name} style={{color:Theme.commonFontColor, fontSize:14}}/>
                        <CustomeTextInput style={{ flex: 5,marginLeft:15 }} value={passenger.Name} onChangeText={text => { passenger.Name = text; this.setState({}) }} placeholder='须与登机证件姓名一致' />
                        {
                            <TouchableHighlight underlayColor='transparent' onPress={() => {this.setState({select:!select})}}>
                                <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                    <View style={{ backgroundColor: !select ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }}>
                                        <CustomText text='中' style={{ color: !select ? '#fff' : Theme.commonFontColor}} />
                                    </View>
                                    <View style={{ backgroundColor: select ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopRightRadius: 3, borderBottomRightRadius: 3 }}>
                                        <CustomText text='EN' style={{ color: select ? '#fff' : Theme.commonFontColor}} />
                                    </View>
                                </View>
                            </TouchableHighlight>
                        }
                    </View>
                    :null
                }
                {Util.Read.certificateType2(passenger.CertificateType) === 128 && select     
                    ?
                <View>
                    <View style={[styles.row,{paddingHorizontal:1,height:50}]}>
                        <View style={{flexDirection:'column' ,flex:3}}>
                            <HighLight name='姓（拼音）' style={{fontSize:14,color:Theme.commonFontColor}}/>
                            <CustomText text='Surname' />
                        </View>
                        <CustomeTextInput style={styles.input} placeholder={'须与登机证件姓一致'} value={passenger.LastName || passenger.Surname} onChangeText={text => {
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
                            <TouchableHighlight underlayColor='transparent' onPress={() => {this.setState({select:!select})}}>
                                <View style={{ flexDirection: 'row', alignItems: "center" }}>
                                    <View style={{ backgroundColor: !select ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }}>
                                        <CustomText text='中' style={{ color: !select ? '#fff' : Theme.commonFontColor}} />
                                    </View>
                                    <View style={{ backgroundColor: select ? Theme.theme : Theme.normalBg, height: 22, width: 36, alignItems: "center", justifyContent: 'center', borderTopRightRadius: 3, borderBottomRightRadius: 3 }}>
                                        <CustomText text='EN' style={{ color: select ? '#fff' : Theme.commonFontColor }} />
                                    </View>
                                </View>
                            </TouchableHighlight>
                    </View>
                    <View style={[styles.row,{paddingHorizontal:1,height:50}]}>
                        <View style={{flexDirection:'column',flex:4 }}>
                            <HighLight name='名（拼音）' style={{fontSize:14,color:Theme.commonFontColor}} />
                            <CustomText text='Given name' />
                        </View>
                        <CustomeTextInput style={[styles.input,{flex:7}]} value={passenger.FirstName || passenger.GivenName} placeholder={'须与登机证件名一致'} onChangeText={text => {
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
                <SelectView titleName={'证件类型'}
                            required={false}
                            _selectName={Util.Read.certificateTransfer(passenger.CertificateType)}
                            _placeholder={''} 
                            _callBack={()=>{
                                this.setState({ 
                                    papersOptions: this.state.papersOptions
                                });
                                if (PickerHelper && typeof PickerHelper.hide === 'function') {
                                    PickerHelper.hide();
                                }
                                this.ActionSheet.show();
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
                    (passenger.CertificateType === "身份证" || passenger.CertificateType === "Chinese ID Card") ? null :
                      <View>
                        <SelectView titleName={'国籍/地区'}
                                required={true}
                                _selectName={nationalzhName?nationalzhName:(noComp ? nocomp_national : comp_national)}
                                _placeholder={'请选择国籍/地区'} 
                                _callBack={()=>{
                                    this._toSelectCounty()
                                }}
                        />
                        <SelectView titleName={'有效期至'}
                                required={true}
                                _selectName={passenger.Expire ?passenger.Expire:""}
                                _placeholder={'请选择证件有效期'} 
                                _callBack={()=>{
                                    this._pickerShow(2)
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
                        <SelectView titleName={'出生日期'}
                                    required={true}
                                    _selectName={passenger.Birthday ? passenger.Birthday : ''}
                                    _placeholder={'请选择出生日期'} 
                                    _callBack={()=>{
                                        this._pickerShow(1);
                                    }}
                        />
                      </View>
                }
                <Bt_inputView dicKey={'E-mail'} 
                                bt_text={passenger.Email} 
                                _placeholder={customerInfo.EmailRequired?'邮箱(必填)':'邮箱(选填)'} 
                                _callBack={(text)=>{
                                        passenger.Email = text; 
                                        this.setState({}) 
                                }}
                                required={customerInfo.EmailRequired}
                />

                <CustomActioSheet ref={o => this.ActionSheet = o} options={this.state.papersOptions} onPress={this._handlePress} />
                <CustomActioSheet ref={o => this.GenderActionSheet = o} options={sexOptions} onPress={this._selectSex} />
                {/* {
                     customerInfo.EmployeeDictList && customerInfo.EmployeeDictList.length > 0 ?
                     customerInfo.EmployeeDictList.map((obj, index) => {
                         let itemIndex =AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
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
                     customerInfo.EmployeeDictList && customerInfo.EmployeeDictList.length > 0 ?
                     customerInfo.EmployeeDictList.map((obj, index) => {
                        //  let itemIndex =AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
                        let itemIndex;
                        //  if(this.params.noComp?obj.BusinessCategory&8:obj.BusinessCategory&128){
                            itemIndex = AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(
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
                         let item_name =Util.Parse.isChinese()? (itemIndex && itemIndex.ItemName):(itemIndex && itemIndex.ItemEnName)
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
                            //      {obj.IsRequire?<HighLight name={Util.Parse.isChinese()? obj.Name:obj.EnName} />:<CustomText text={Util.Parse.isChinese()? obj.Name:obj.EnName} style={{ flex: 3 }} />}
                            //      {
                            //          obj.NeedInput ?
                            //              <View style={{backgroundColor:obj.IsRequire&& !item_name?'#F7CCD1':'#fff',height:38,flex: 7,justifyContent:'center'}}>
                            //                 <CustomeTextInput style={{ flex: 7 }} value={item_name} placeholder={Util.Parse.isChinese()?obj.Remark:obj.EnRemark} editable={obj.IsEditInput} onChangeText={(text) => {
                            //                     this._valueCHange(text, obj);
                            //                 }} />
                            //              </View>
                            //              :
                            //              <View style={{ flex: 7,height:38,
                            //                             flexDirection: 'row',
                            //                             alignItems: 'center',
                            //                             justifyContent: 'space-between',
                            //                             backgroundColor:obj.IsRequire&& !(item_name)?'#F7CCD1':'#fff'
                            //                          }}>
                            //                  <CustomText text={itemIndex ? (Util.Parse.isChinese()?itemIndex.ItemInput:itemIndex.ItemEnName) : obj.Remark} style={{ color: itemIndex ? null : 'gray', flex: 1 }} 
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
            </KeyboardAwareScrollView>
            {
                 ViewUtil.getThemeButton('完成', this._finishBtnClick)
            }

            </View>
            
        )
    }
    _valueCHange = (text, obj) => {
        const { AdditionIfo } = this.state;
        let itemIndex = AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
        if (itemIndex) {
            itemIndex.Id = obj.Id
            // Util.Parse.isChinese()?
            // itemIndex.ItemName = text
            // :
            // itemIndex.ItemEnName = text;
            itemIndex.ItemName = text
            itemIndex.DictCode = obj.Code
            itemIndex.NeedInput = obj.NeedInpu
        } else {
            let model = {
                DictId: obj.Id,
                Id: obj.Id,
                DictName: obj.Name,
                ItemId: '',
                ItemSerialNumber: '',
                ItemName: text,
                // ItemEnName: Util.Parse.isChinese()?'':text,
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
                    dic.Id = data.Id;
                    // dic.ItemId = data.DictId;
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
                        Id: obj.Id,
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
export default connect(getStatusProps)(TrainComp_EditPassengerScreen);
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
    }
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
