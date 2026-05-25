import React from 'react';
import {
    View, TouchableHighlight, StyleSheet
} from 'react-native';
import SuperView from '../../super/SuperView';
import ViewUtil from '../../util/ViewUtil';
import Util from '../../util/Util';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import CustomeTextInput from '../../custom/CustomTextInput';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PickerHelper from '../../common/PickerHelper';
import HighLight from '../../custom/HighLight';
import CustomActioSheet from '../../custom/CustomActionSheet';
import AntDesign from 'react-native-vector-icons/AntDesign';
import I18nUtil from '../../util/I18nUtil';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CommonService from '../../service/CommonService';
import GlobalStyles from '../../res/styles/GlobalStyles';
import { Bt_inputView, InfoDicView, SelectView,No_inputView }  from '../../custom/HighLight';

// let textInput = React.createRef();
export default class InterHotel_compEditScreen extends SuperView {
    constructor(props) {
        super(props);
        this._enNameToastTs = 0;
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this.passenger = Util.Encryption.clone(this.params.passenger || { SexDesc: '男', Sex: 1 ,CertificateType:'身份证'});
        this._navigationHeaderView = {
            title: '编辑乘客',
            // rightButton: ViewUtil.getRightButton('保存', this._finishBtnClick)
        }
        let additionArr = this.passenger && this.passenger.Addition?this.passenger.Addition: 
                          this.passenger&&this.passenger.AdditionInfo?this.passenger.AdditionInfo:null
        this.state = {
            // papersOptions: ['中国居民身份证', '护照', '港澳台居民居住证', '外国人永久居留身份证', '台湾居民来往大陆通行证', '港澳居民来往内地通行证'],
            papersOptions: ['身份证'],
            sexOptions: ['男', '女'],
            isEditSerinumber: false,
            isEditMobile:false,
            SerialNumber:'',
            // 数据字典
            AdditionIfo: additionArr? {
                ...additionArr,
                DictItemList: additionArr.DictItemList ? additionArr.DictItemList : []
            } : {
                    DictItemList: []
            },
            CardTravel:this.passenger.CardTravel,
            hotelCardList:[],
            hotelTravelList:[],
        }
    }

    _finishBtnClick = () => {
        const { passenger } = this;
        const { SerialNumber,CardTravel } = this.state;
        const {IsNeedIDCard,customerInfo} = this.params;
        passenger.Addition = this.state.AdditionIfo;
        passenger.AdditionInfo = this.state.AdditionIfo;
        passenger.CardTravel = CardTravel;
        if(IsNeedIDCard){
            if (!passenger.Name) {
                this.toastMsg('姓名不能为空');
                return;
            }
            if(!Util.RegEx.isRealHotelName(passenger.Name)){
                this.toastMsg('请按照姓名提示要求填写');
                return;
              }
            if (!SerialNumber) {
                this.toastMsg('证件号不能为空');
                return;
            }
        }
        if (!passenger.LastName && !passenger.Surname ) {
            this.toastMsg('英文姓不能为空');
            return;
        }
        if(passenger.Surname || passenger.LastName){
            let EnglishName = passenger.LastName || passenger.Surname
            if(Util.RegEx.isEnName(EnglishName)){
                this.toastMsg('英文姓只能包含字母');
                return;
            }
        }
        if (!passenger.FirstName && !passenger.GivenName ) {
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
        if(!passenger.Email && customerInfo.EmailRequired){
            this.toastMsg('邮箱不能为空');
            return;
            }
            if (passenger.Email && !Util.RegEx.isEmail(passenger.Email)) {
            this.toastMsg('请输入正确的邮箱格式');
            return;
            }
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
        

        let item;
        let CertificateList;
        if (passenger.Certificate && typeof(passenger.Certificate) === 'string') {
            try{
            CertificateList = JSON.parse(passenger.Certificate) || [];
            item = CertificateList.find(item => item.TypeDesc === '身份证');
            }catch(e){
                console.error('Certificate parse error:', e);
            }
        }
        
        if(item){
            item.SerialNumber = SerialNumber;
            passenger.Certificate = JSON.stringify(CertificateList);
            this.params.callBack(passenger,SerialNumber);
            this.pop();
        }
        else{
            this.params.callBack(passenger,1,SerialNumber);
            this.pop();
        }
        
    }
    componentDidMount() {
        const { passenger } = this;
        const { SerialNumber } = this.state;
        if(passenger&&passenger.CertificateId&&passenger.CertificateId==1){
            this.setState({
                SerialNumber:passenger.CertificateNumber
            })
        }else{
            let item;
            if (passenger.Certificate && typeof(passenger.Certificate) === 'string') {
                try{
                let CertificateList = JSON.parse(passenger.Certificate) || [];
                item = CertificateList.find(item => item.Type === 1);
                }catch(e){
                    console.error('Certificate parse error:', e);
                }
            }
            this.setState({
                SerialNumber:item&&item.SerialNumber
            })
        }
        this._loadList();      
    }
    _loadList = () => {
        this.showLoadingView();
        let model = {
            key:''
        }
        CommonService.HotelGroupList(model).then(response => {
            this.hideLoadingView();
            if (response && response.data) {
                let hotelTravelList=[]
                const commenArr = 
                response.data.items&&response.data.items.map((item)=>({
                    SerialNumber:null,
                    HotelGroupId:item.id,
                    HotelGroupName:item.text
                }))
               if(commenArr&& commenArr.length>0){
                    commenArr?.map((item)=>{
                        this.passenger.HotelCardTravellerList&&this.passenger.HotelCardTravellerList.map((item2)=>{
                            if(item.HotelGroupId == item2.HotelGroupId){
                                item.SerialNumber = item2.SerialNumber
                            }
                        })
                        hotelTravelList.push(item.HotelGroupName);
                    })
                }
                this.setState({
                    hotelCardList: commenArr,
                    hotelTravelList:hotelTravelList
                })
            } else {
                this.toastMsg('获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
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
        PickerHelper.create(PickerHelper.createYYYYMMDDDate(), null, (data) => {
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
            this.passenger.CertificateNumber = '';
            this.passenger.Expire = '';
            this.passenger.IssueNationName = '';
            this.passenger.IssueNationCode = '';
            if (this.passenger.Certificate && typeof(this.passenger.Certificate) === 'string') {
                let CertificateList = JSON.parse(this.passenger.Certificate) || [];
                let Type = Util.Read.certificateType2(this.passenger.CertificateType)
                let obj = CertificateList.find(item => item.Type == Type );
                if (obj) {
                    this.passenger.CertificateNumber = obj.SerialNumber;
                    this.passenger.Expire = obj.Expire;
                    this.passenger.IssueNationName = obj.IssueNationName;
                    this.passenger.IssueNationCode = obj.IssueNationCode;
                }
            }
        }
        // textInput.current._root.focus();

        this.setState({});
    }
    _HotelCardHandlePress = (_index) => {
        const {hotelCardList} = this.state;
        let arr = [];
        if(_index!= 'cancel'){
            hotelCardList&&hotelCardList.map((item,index)=>{
                if(index==_index){
                    arr.push(item)
                this.setState({
                    CardTravel:arr
                })
                }
            })
        }else{
            this.setState({
                CardTravel:null
            })
        }
    }
    /**
     *  选择性别
     */
    _selectSex = () => {
        if(this.passenger.fromComp===1){
            if (this.passenger.Gender === 1) {
                this.passenger.Gender = 2;
            } else {
                this.passenger.Gender = 1;
            }
        }else{
            if (this.passenger.SexDesc === '男') {
                this.passenger.SexDesc = '女';
                this.passenger.Sex = 2;
            } else {
                this.passenger.SexDesc = '男';
                this.passenger.Sex = 1;
            }
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
        this.push('NationalCity', {
            refresh: (item) => {
                this.passenger.NationalCode = item.Code;
                this.passenger.NationalName = item.Name;
                this.setState({
                });
            }
        });
    }   
    renderBody() {
        const { index,IsNeedIDCard, customerInfo, noComp, IsRewardPointTVP } = this.params;//IsNeedIDCard判断酒店是否需要证件信息
        const { passenger } = this;
        const { isEditSerinumber ,isEditMobile,SerialNumber,AdditionIfo,CardTravel} = this.state;
        let nocomp_national = passenger.NationalityCode&&passenger.Nationality ? passenger.Nationality : ''
        let comp_national = passenger.NationalCode&&passenger.NationalName ? passenger.NationalName : ''
        return (
            <View style={{ flex:1}}>
            {
                ViewUtil.getNameTips()
            }
            <KeyboardAwareScrollView keyboardShouldPersistTaps="handled" style={GlobalStyles.keyViewSy}  showsVerticalScrollIndicator={false}>
            {
                index === 1 ?
                    ViewUtil.getNameTips2()
                : null
            }
            <Bt_inputView dicKey={'姓名'} 
                        required={false}
                        bt_text={passenger.Name} 
                        _placeholder={'证件上的真实姓名'} 
                        _haveInfoAler={true}
                        _clickOnpress={()=>{
                            this._alertTip()
                        }}
                        _callBack={(text)=>{
                            passenger.Name = text; 
                            this.setState({travName:passenger.Name})
                        }}
                        no_editable={(IsNeedIDCard) ? false : true}
                                
            />
                {/* <View style={styles.row}>
                    <View style={{ alignItems: 'center', flexDirection: 'row', flex: 3 }}>
                        <CustomText text='姓名' />
                        <TouchableHighlight underlayColor='transparent' onPress={this._alertTip}>
                            <AntDesign name={'questioncircleo'} size={26} color={Theme.theme} style={{ marginLeft: 5 }} />
                        </TouchableHighlight>
                    </View>
                    {IsNeedIDCard?
                    <CustomeTextInput style={{ flex: 7 }} value={passenger.Name} onChangeText={text => { passenger.Name = text; this.setState({travName:passenger.Name}) }} placeholder='姓名,与登机所持证件中的姓名一致' />
                    :
                    <CustomText style={{flex: 7}} text={passenger.Name}/>
                    }
                </View> */}
                <Bt_inputView dicKey={'英文姓'}
                                  required={true} 
                                  bt_text={
                                    passenger.LastName|| passenger.Surname
                                  } 
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
                                  bt_text={
                                    passenger.FirstName || passenger.GivenName
                                  } 
                                  _placeholder={'名'} 
                                  warm_text={'需与证件一致'} 
                                  _callBack={(text)=>{
                                       passenger.FirstName = text;
                                       passenger.GivenName = text;
                                       this.setState({});
                                  }}
                                  isEnName={true}
                />
                
                {IsNeedIDCard?
                  <View>
                    <SelectView titleName={'证件类型'}
                            required={false}
                            _selectName={'身份证'}
                            _placeholder={''} 
                            _callBack={()=>{
                                    
                            }}
                    />
                    <Bt_inputView dicKey={'证件号码'}
                                    required={false} 
                                    bt_text={isEditSerinumber ?
                                                    SerialNumber : 
                                                    Util.Read.simpleReplace(SerialNumber)} 
                                    _placeholder={'证件号码(必填)'} 
                                    _onFocus={()=>{
                                            this.setState({ isEditSerinumber: true,SerialNumber: ''})
                                    }}
                                    _onBlur={()=>{
                                            this.setState({ isEditSerinumber: false })
                                    }}
                                    _callBack={(text)=>{
                                            if (this.state.isEditSerinumber) {
                                                this.setState({
                                                    SerialNumber:text
                                                });
                                            }
                                    }}
                    />
                  </View>:null
                }
                {/* {
                    passenger.CertificateType === '港澳居民来往内地通行证' || passenger.CertificateType === '台湾居民来往大陆通行证' || passenger.CertificateType === '外国人永久居留身份证' ?
                        <View style={styles.row}>
                            <CustomText text='出生日期' style={{ flex: 3 }} />
                            <CustomText style={{ flex: 7, color: passenger.Birthday ? null : 'gray' }} text={passenger.Birthday ? passenger.Birthday : '请输入生日'} onPress={this._pickerShow.bind(this, 1)} />
                        </View>
                        : null
                } */}
                {/* <View style={styles.row}>
                    <CustomText text='性别' style={{ flex: 3 }} />
                    <CustomText style={{ flex: 7, color: passenger.SexDesc ? null : 'gray' }} onPress={this._selectSex} text={passenger.SexDesc} />
                </View> */}
                {/* {
                    passenger.CertificateType === '护照' || passenger.CertificateType === '外国人永久居留身份证' ?
                        <View style={styles.row}>
                            <CustomText text='国家地区' style={{ flex: 3 }} />
                            <View style={{ flex: 7, flexDirection: 'row', alignItems: 'center' }}>
                                <CustomText style={{ flex: 1, color: passenger.NationalName ? null : 'gray' }} text={passenger.NationalName ? passenger.NationalName : '选择国家'} onPress={this._toSelectCounty} />
                                <Ionicons name={'ios-arrow-forward'} size={22} color={'lightgray'} />
                            </View>
                        </View>
                        : null
                }
                {
                    passenger.CertificateType === '外国人永久居留身份证' || passenger.CertificateType === '台湾居民来往大陆通行证' || passenger.CertificateType === '港澳居民来往内地通行证' ?
                        <View style={styles.row}>
                            <CustomText text='证件有效期' style={{ flex: 3 }} />
                            <CustomText style={{ flex: 7, color: passenger.Birthday ? null : 'gray' }} text={passenger.Expire ? passenger.Expire : '请输入证件有效期'} onPress={this._pickerShow.bind(this, 2)} />
                        </View>
                        : null
                } */}
                <SelectView titleName={'国籍/地区'}
                                    required={false}
                                    _selectName={noComp ? nocomp_national : comp_national}
                                    _placeholder={'请选择国籍/地区'} 
                                    _callBack={()=>{
                                        this._toSelectCounty()
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
                {/* <SelectView titleName={'酒店会员卡'}
                                required={false}
                                _selectName={CardTravel&&CardTravel[0]&&CardTravel[0].HotelGroupName}
                                _placeholder={''} 
                                _callBack={()=>{
                                    this.CardTravellerActionSheet.show();
                                }}
                    /> */}
                {IsRewardPointTVP?
                   <SelectView titleName={'酒店会员卡'}
                                required={false}
                                _selectName={CardTravel&&CardTravel[0]&&CardTravel[0].HotelGroupName}
                                _placeholder={''} 
                                _callBack={()=>{
                                    this.CardTravellerActionSheet.show();
                                }}
                    />
                    :null
                }
                {IsRewardPointTVP?
                <Bt_inputView dicKey={'酒店会员卡号'} 
                            bt_text={CardTravel&&CardTravel[0]&&CardTravel[0].SerialNumber} 
                            _placeholder={'请输入酒店会员卡号'} 
                            _callBack={(text)=>{
                                if(CardTravel&&CardTravel[0]&&CardTravel[0]){
                                    CardTravel[0].SerialNumber = text; 
                                    this.setState({})
                                }
                            }}
                            required={false}
                    />:null
                }
                {/* {IsRewardPointTVP?
                    <View style={styles.row}>
                        <CustomText text='酒店会员卡号' style={{ flex: 3 }} />
                        <View style={{height:38,flex: 7,justifyContent:'center'}}>
                        <CustomeTextInput style={{ flex: 7 }} 
                                        value={CardTravel&&CardTravel[0]&&CardTravel[0].SerialNumber} 
                                        onChangeText={text => { 
                                            if(CardTravel&&CardTravel[0]&&CardTravel[0]){
                                                CardTravel[0].SerialNumber = text; 
                                                this.setState({})
                                            }else{
                                            }
                                        }} 
                                        placeholder='请输入酒店会员卡号' />
                        </View>
                    </View>
                    :null
                } */}
                 {
                     customerInfo.EmployeeDictList && customerInfo.EmployeeDictList.length > 0 ?
                     customerInfo.EmployeeDictList.map((obj, index) => {
                        //  let itemIndex =AdditionIfo.DictItemList.find(item => item.DictId === obj.Id);
                         let itemIndex;
                        //  if(noComp?obj.BusinessCategory&64:obj.BusinessCategory&128){
                            itemIndex = AdditionIfo.DictItemList&&AdditionIfo.DictItemList.find(
                                item => item.DictCode === obj.Code
                            );
                            if(itemIndex){
                                itemIndex.DictName = obj.Name
                                itemIndex.DictEnName = obj.EnName
                                itemIndex.DictId = obj.Id
                            }else{
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
                            //      {obj.IsRequire?<HighLight name={Util.Parse.isChinese()? obj.Name:obj.EnName} />:<CustomText text={Util.Parse.isChinese()? obj.Name:obj.EnName} style={{ flex: 3 }} />}
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
                            //  </View>
                            :null
                         )
                     })
                     : null
                }
                <CustomActioSheet ref={o => this.ActionSheet = o} options={this.state.papersOptions} onPress={this._handlePress} />
                <CustomActioSheet ref={o => this.CardTravellerActionSheet = o} options={this.state.hotelTravelList} onPress={this._HotelCardHandlePress} />   
            </KeyboardAwareScrollView>
            {
                ViewUtil.getThemeButton('保存', this._finishBtnClick)
            }

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
                    dic.Id = data.Id;
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
        flex: 7,
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
