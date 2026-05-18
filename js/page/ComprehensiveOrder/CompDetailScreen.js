import React from 'react';
import {
    View,
    StyleSheet,
    TouchableHighlight,
    ScrollView,
    TouchableOpacity,
    Platform,
    Image,
    Modal,
    DeviceEventEmitter,
    Text,
    InteractionManager
} from 'react-native';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import CustomeTextInput from '../../custom/CustomTextInput'
import Theme from '../../res/styles/Theme';
import ComprehensiveService from '../../service/ComprehensiveService'
import TextViewTitle from '../../custom/TextViewTitle'
import TextView from './View/TextView'
import FlightView from './View/FlightView'
import IntlFlightView from './View/IntlFlightView'
import TrainView from './View/TrainView'
import HotelView from './View/HotelView';
import IntlHotelView from './View/IntlHotelView';
import NavigationUtils from '../../navigator/NavigationUtils';
import Util from '../../util/Util';
import CommonEnum from '../../enum/CommonEnum';
import ViewUtil from '../../util/ViewUtil';
import {connect, connectAdvanced} from 'react-redux';
import Action from '../../redux/action/index';
import CompAdditionInfoView from '../common/CompAdditionInfoView';
import CommonService from '../../service/CommonService';
import ApplicationService from '../../service/ApplicationService';
import AntDesign from 'react-native-vector-icons/AntDesign'
import HighLight from '../../custom/HighLight';
import InflFlightService from '../../service/InflFlightService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNFileSelect from 'react-native-file-select-mk';
import RNFetchBlob from 'rn-fetch-blob';
import OpenGetPic from '../../service/OpenGetPic';
import OrderDetailInfoView from '../common/OrderDetailInfoView';
import BackPress from '../../common/BackPress';
import  LinearGradient from 'react-native-linear-gradient';
import I18nUtil from '../../util/I18nUtil';
import Key from '../../res/styles/Key';
import { Bt_inputView }  from '../../custom/HighLight';
import { TitleView2 } from '../../custom/HighLight';
import UserInfoUtil from '../../util/UserInfoUtil';

class CompDetailScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '综合订单详情',
            // hide:true,
            statusBar: {
                backgroundColor: Theme.theme,
            },
            style: {
                backgroundColor: Theme.theme,
            },
            titleStyle: {
                color: 'white'
            },
            leftButton2:true,  
            leftButton: ViewUtil.getLeftBackButton2(this._stopBackEvent)
        }
        this._tabBarBottomView = {
            bottomInset: true
        }
        let customerInfo = this.props.customerInfo_userInfo&&this.props.customerInfo_userInfo.customerInfo
        let category = [
            {
                Key:1,
                Value:'国内机票',
                image: require('../../res/Uimage/_flight.png'),
                hasAuth:Util.Encryption.clone(customerInfo.Addition.HasAirAuth)
            },
            {
                Key:2,
                Value:'火车票',
                image: require('../../res/Uimage/m_train.png'),
                hasAuth:Util.Encryption.clone(customerInfo.Addition.HasTrainAuth)
            },
            {
                Key:4,
                Value:'国内酒店',
                image: require('../../res/Uimage/m_hotel.png'),
                hasAuth:Util.Encryption.clone(customerInfo.Addition.HasHotelAuth)
            },
            {
                Key:8,
                Value:'港澳台及国际机票',
                image: require('../../res/Uimage/m_intFlight.png'),
                hasAuth:Util.Encryption.clone(customerInfo.Addition.HasInterAirAuth)
            },
            {
                Key:16,
                Value:'港澳台及国际酒店',
                image: require('../../res/Uimage/m_intHotel.png'),
                hasAuth:Util.Encryption.clone(customerInfo.Addition.HasInterHotelAuth)
            },
           
        ]

        let _option=[];
        let _optionList=[]
        category.map((item)=>{
            if(item.hasAuth){
                _option.push(item.Value);
                _optionList.push(item);
            }
        })

        this.state = {
            keyWord: '',
            projectList: [],
            DomesticFlightsList: [],
            baseInfo:null,
            ServiceFeesShow:false,
            profileArr:[],
            airPortData:[],
            customerInfo:customerInfo,
            fileList:[],
            visible: false,
            showImageUrl: '',
            AirLineArr:[],
            applyAddtionInfo:{},
            isStop:this.params.isStop,
            PdfDictList:[],

            optionList:this.params.optionList?this.params.optionList:_optionList,
            option:this.params.option?this.params.option:_option,
            noApply:false,
            apply:null,
            goCityDisplay:null,
            arrivalCityDisplay:null,
            BeginTime:null,
            EndTime:null,
            goCityDisplay2:null,
            arrivalCityDisplay2:null,
            BeginTime2:null,
            EndTime2:null,
            isAlertAhow:false,
            emailArrStr:'',
        }
        this.backPress = new BackPress({ backPress: () => this._stopBackEvent() })
    }

    // 重置手势滑动
    static navigationOptions = ({ navigation }) => {
        return {
            gesturesEnabled: false
        }
    }

    _stopBackEvent = () => {
        if (!this.state.isStop) {
            this.pop();
        }else{
            NavigationUtils.popToTop(this.props.navigation);
            InteractionManager.runAfterInteractions(() => {
                DeviceEventEmitter.emit('deleteApply', {});
            });
        }
        return true;
    }

    componentDidMount(){
        const { customerInfo } = this.state;
        this.backPress.componentDidMount();
        this.homeListener = DeviceEventEmitter.addListener(
            'freshCompDetail',  //监听器名
            () => {
                this._loadDetailData()
            },
        );
        if(!Util.Parse.isChinese()){
            this._loadAirport()//获取机场英文
            this._AirLineEn()//获取航空公司
        }
        if(this.params.orderId){
            this._loadDetailData()//获取综合订单详情
        }else{
            this._reloadProjectList();//创建综合订单详情
        }
        customerInfo.selectedNeed = true
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.backPress.componentWillUnmount();
        this.homeListener.remove();
    }

    _AirLineEn=()=>{
        let model = {
            AirlineCodes:[],
        }
        this.showLoadingView()
        InflFlightService.CommonAirline(model).then(response => {
            this.hideLoadingView()  
            if (response && response.success && response.data) {
                this.setState({
                    AirLineArr:response.data
                })
            }else{
                this.toastMsg(response.message);
            }
        }).catch(error => {
            this.hideLoadingView()
            this.toastMsg(error.message || '加载数据失败请重试');
        })
    }

    _commonCityHotel = () =>{
        const {cityList} = this.params
        if(!cityList){return};
        let model = {
            Keyword: cityList[0]&&cityList[0].ArrivalCityName,
            Domestic:''
        }
        this.showLoadingView()
        CommonService.CommonCity(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data && response.data) {
                    response.data.map((obj)=>{
                        if(obj.Name == cityList[0].ArrivalCityName.replace('市','') ){
                            if(cityList&&cityList[0].ArrivalNationalCode === 'CN'){
                                this.push('HotelSearchIndex', { 
                                    isIntl: false,
                                    selectTap:4,
                                    noApply:true,
                                    arrivalCityDisplay:obj,
                                });
                            }else{
                                this.push('HotelSearchIndex', { 
                                    isIntl: false,
                                    selectTap:6,
                                    noApply:true,
                                    arrivalCityDisplay:obj,
                                });
                            }
                        }
                    })
                }
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    _getProfileData(){
        const {customerInfo,AdditionIfo} = this.state;
        const {applySerialNumber,cityList} = this.params
        let customerDicList = customerInfo.DictList;//公司字典项列表
        let DicListArr=[];//储存公司字典项Id
        let EmployeeDictListArr=[]//储存个人字典项Id
        let diffDicList = [];
        customerDicList&&customerDicList.map((item)=>{
            DicListArr.push(item.Id);
        })
        customerInfo.EmployeeDictList&&customerInfo.EmployeeDictList.map((item)=>{
            EmployeeDictListArr.push(item.Id);
        })
        let diffArr = DicListArr;            
        customerDicList&&customerDicList.map((item)=>{
            diffArr&&diffArr.map((diffitem)=>{
                if(item.Id == diffitem){
                    diffDicList.push(item)
                }
            })
        })
        const profileArr = 
        diffDicList&&diffDicList.map(item => ({  
                DictId:item.Id, 
                Id:item.Id,
                DictName:item.Name,
                EnName:item.EnName,
                ItemId:null,
                ItemName:null,
                ItemEnName:null,
                ItemSerialNumber:null,
                RemarkNo:item.RemarkNo,
                Remark:item.Remark,
                EnRemark:item.EnRemark,
                FormatRegexp:item.FormatRegexp,
                IsRequire:item.IsRequire,
                ItemInput:null,
                NeedInput:item.NeedInput,
                BusinessCategory:item.BusinessCategory,
                NextId:item.NextId,
                ShowInOrder:item.ShowInOrder,
                DictCode:item.Code,
                IsShowWhenMissingHotelUnitInMassOrder:item.IsShowWhenMissingHotelUnitInMassOrder
            }))
        this.setState({
            profileArr:profileArr,
        },()=>{
            let addition = customerInfo&&customerInfo.Addition&&customerInfo.Addition
            let bookStr = Util.Parse.isChinese() ? '提交订单' : 'Confirm booking'
            if( (cityList&&cityList[0].ArrivalNationalCode === 'CN'&& addition.HasHotelAuth)||(cityList&&cityList[0].ArrivalNationalCode != 'CN'&& addition.HasInterHotelAuth)){
                this.showAlertView('订单尚未完成，请选择继续添加其他行程或点击提交订单进入下一步', () => {
                    return ViewUtil.getAlertButton(bookStr, () => {
                        this.dismissAlertView();
                        // NavigationUtils.popToTop(this.props.navigation);
                    }, '添加酒店行程', () => {
                        this.dismissAlertView();
                        if(applySerialNumber){
                            if(cityList&&cityList[0].ArrivalNationalCode === 'CN'){
                                this.push('ApplicationSelect',{
                                    from:'hotel',
                                    andFrom:'compDetail', 
                                    // applySerialNumber:apply&&apply.SerialNumber,
                                    customerInfo:customerInfo,
                                    SerialNumber:applySerialNumber,
                                    cityList:this.params.journey.Journeys 
                                });
                            
                            }else{
                                    this.push('ApplicationSelect',{
                                        from:'intlHotel',
                                        SerialNumber:applySerialNumber,
                                        andFrom:'compDetail',
                                        customerInfo:customerInfo,
                                        cityList:this.params.journey.Journeys 
                                    });
                            }
                        }else{
                            this._commonCityHotel();
                        }
                    })
                }) 
            }
        })    
    }

    async _getShowServiceFees(){
        //服务费
        let model={
            OrderCategory:13,
            MatchModel:null,
        }
        this.showLoadingView('加载中....');
       await CommonService.CurrentCustomerServiceFees(model).then(response => {
            this.hideLoadingView();
            if (response && response.success&&response.data) {
                this.setState({
                    ServiceFeesShow:response.data.IsShowServiceFee,
                })
            }
            this._getCurrentDictList();
        }).catch(error => {
            this._getCurrentDictList();
            this.hideLoadingView();
        })
       
    }
    
    async _getCurrentDictList(){
        const { baseInfo, customerInfo } = this.state;
        let model1 = {
            OrderCategory: 13,
            ShowInApply: false,
            ShowInDemand: false,
            ReferenceEmployeeId:baseInfo.ReferenceEmployeeId,
            ReferencePassengerId:baseInfo.ReferencePassengerId,
        }
        this.showLoadingView();
       await CommonService.CurrentDictList(model1).then(currentDictList => {
            this.hideLoadingView();
            if (currentDictList && currentDictList.success) {
                customerInfo.DictList = currentDictList.data;
                this.setState({
                    customerInfo
                },()=>{
                    this._getProfileData() //处理综合订单的profile信息
                })
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message);
        })
    }

    _loadAirport(){
        this.showLoadingView();
        InflFlightService.GetCommonAirport2().then(response => {
            this.hideLoadingView();
            if (response) {
                this.setState({
                    airPortData: response.data,
                })
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || "获取数据异常");
        })

    }
    
    /**
     * 从综合订单过来获取详情
     */
    async _loadDetailData(){
        const { orderId } = this.params;
        let model = {
            OrderId:orderId
        }
        this.showLoadingView('加载数据中...')
        await ComprehensiveService.MassOrderDetail(model).then(response => { 
            this.hideLoadingView()  
            if (response && response.success && response.data) {
                this.setState({
                      baseInfo:response.data,
                      emailArrStr:response.data.Contact&&response.data.Contact.Email,
                   },()=>{
                        this._getShowServiceFees() //是否显示服务费 
                        if(response.data.ApplyId > 0){
                           this._getApplyInfo(response.data) 
                        }
                   })
            }
        }).catch(error => {
            this.hideLoadingView()  
            this.toastMsg(error.message || '加载数据失败请重试');
        })
    }

    _getApplyInfo=(baseInfo)=>{
        if(!baseInfo){return}          
        let model = {
            Id: baseInfo.ApplyId
        }
        ApplicationService.travelApplyDetail(model).then(response => {
            if(response&&response.success&&response.data){
                this.props.setApply(response.data);
                let option = (response.data.CategoryIntro || '').split('、')
                let optionlist = []
                this.state.optionList.map((item)=>{
                    if(option.includes(item.Value)){
                        optionlist.push(item);
                    }
                })
                this.setState({
                    applyAddtionInfo:{
                        DictItemList:response.data.Addition&&response.data.Addition.DictItemList
                    },
                    option:option,
                    optionList:optionlist,
                })
                if(response.data.Destination&&response.data.Destination.DepartureList&&response.data.Destination.DepartureList.length>0){
                    this.setState({
                        BeginTime:response.data.Destination.BeginTime,
                        EndTime:response.data.Destination.EndTime,
                        noApply:false,
                        apply:response.data
                    },()=>{
                        this._commonCity1(response.data.Destination.DepartureList[0].Name);
                        this._commonCity2(response.data.Destination.DestinationList[0].Name);
                    })
                }else if(response.data.JourneyList){
                    let GuojiList = []
                    let GuoNeiList = []
                    response.data.JourneyList.map((item)=>{
                        if((item.BusinessCategory&16 != 0) || (item.BusinessCategory&8 != 0)){
                            GuoNeiList.push(item);
                        }else{
                            GuojiList.push(item);
                        }
                    })
                    this.setState({
                        BeginTime:GuoNeiList[0] && GuoNeiList[0].BeginTime,
                        EndTime:GuoNeiList[0] && GuoNeiList[0].EndTime,
                        BeginTime2:GuojiList[0] && GuojiList[0].BeginTime,
                        EndTime2:GuojiList[0] && GuojiList[0].EndTime,
                        noApply:false,
                        apply:response.data
                    },()=>{
                        // let jList = response.data.JourneyList&&response.data.JourneyList[0]&&response.data.JourneyList[0]
                        let JList =GuojiList&&GuojiList[0]
                        let NList =GuoNeiList&&GuoNeiList[0] 
                        this._commonCity1(JList&&JList.Departure,1);
                        this._commonCity2(JList&&JList.Destination,1);
                        this._commonCity1(NList&&NList.Departure,0);
                        this._commonCity2(NList&&NList.Destination,0);
                    })
                }

            }else {
                this.toastMsg(response.message || '获取数据失败');
            }
        })
    }

    //分开写 写两个 _commonCity
    _commonCity1 = (item,index) =>{
        let model = {
            Keyword: item,
            Domestic:''
        }
        CommonService.CommonCity(model).then(response => {
            if (response && response.success) {
                if (response.data && response.data) {
                    response.data.map((obj)=>{
                        if(obj.Name == item.replace('市','') ){
                            if(index==0){
                                this.setState({
                                goCityDisplay:obj
                                })
                            }else{
                                this.setState({
                                goCityDisplay2:obj
                                })
                            } 
                        }
                    })
                }
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }
    _commonCity2 = (item,index) =>{
        let model = {
            Keyword: item,
            Domestic:''
        }
        CommonService.CommonCity(model).then(response => {
            if (response && response.success) {
                if (response.data && response.data) {
                    response.data.map((obj)=>{
                        if(obj.Name == item.replace('市','') ){
                            if(index==0){
                                this.setState({
                                    arrivalCityDisplay:obj
                                })
                                }else{
                                    this.setState({
                                    arrivalCityDisplay2:obj
                                })
                                } 
                        }
                    })
                }
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    _reloadProjectList = () => {
        const { data,comp_userInfo,goFlightData,hotelModel,trainData,IntlHotelModel,intlFlightModel } = this.params
        const { DomesticFlightsList } = this.state;
        const { compMassOrderId } = this.props;
        if(goFlightData){
            DomesticFlightsList.push(goFlightData);
        }
        if(!data){return}
        let model = {
            MassOrderId:compMassOrderId, //compMassOrderId ,综合订单id，有就传值，没有就不传
            RulesTravelId:data.RulesTravelId,//差旅规则id
            Approval:data.Approval,
            ProjectId: comp_userInfo&&comp_userInfo.ProjectId,//项目id
            Platform: Platform.OS,
            Travellers: data.Travellers,//出差人列表
            DomesticFlights:DomesticFlightsList,//国内机票航班列表
            IntlFlight:intlFlightModel?intlFlightModel:null,//国际机票行程信息
            Hotel: hotelModel,//国内酒店信息（包含房型）
            ForeignHotel: IntlHotelModel,//国际酒店信息（包含房型）
            Train: trainData,//火车票车次信息（包含坐席）
            IsClearCardTraveller:false,
        }
        this.showLoadingView()
        ComprehensiveService.MassOrderCreate(model).then(response => {
            this.hideLoadingView()  
            if (response && response.success) {
                if (response.data) {
                    this.setState({
                        baseInfo:response.data
                     },()=>{
                        this._getShowServiceFees() //是否显示服务费 
                     })
                }
           }
        }).catch(error => {
            this.hideLoadingView()
            this.toastMsg(error.message || '加载数据失败请重试');
        })
    }
    _flightMessage = ()=>{
        //业务信息
        const { baseInfo,airPortData,AirLineArr } = this.state;
        const { customerInfo_userInfo } = this.props;
        if(!baseInfo || !baseInfo.OrderItems ||baseInfo.OrderItems.length==0){return}  
        let OrderItems = baseInfo.OrderItems
        let _flight = false;
        let _intlFlight = false;
        let _hotel = false;
        let _train = false;
        let _intlHotel = false;
        let _other = false;
        let showBtn = true;
        customerInfo_userInfo.userInfo.Id==baseInfo.Creator.Id?showBtn=true:showBtn=false;
        OrderItems&&OrderItems.map((item)=>{
            if(item.Category === CommonEnum.orderIdentification.flight){
                _flight = true;
            } 
            if(item.Category === CommonEnum.orderIdentification.intlFlight){
                _intlFlight = true;
            } 
            if(item.Category === CommonEnum.orderIdentification.hotel){
                _hotel = true;
            } 
            if(item.Category === CommonEnum.orderIdentification.train){
                _train = true;
            } 
            if(item.Category === CommonEnum.orderIdentification.intlHotel){
                _intlHotel = true;
            }
            if(item.Category === CommonEnum.orderIdentification.other){
                _other = true;
            } 
        })
        return(
            <View style={{}}>
                { _flight? 
                <View style={styles.itemStyle}>
                    <TextViewTitle title={'机票信息'} imgIcon={require('../../res/Uimage/shu.png')}/>
                    <View style={{paddingBottom:15}}>
                        {
                            OrderItems&&OrderItems.map((item,index)=>{
                                if( item.Category === CommonEnum.orderIdentification.flight ){
                                return(
                                        <FlightView item={item} Status={baseInfo.Status} key={index} AirLineArr={AirLineArr}
                                            callback={()=>{this._flightDetail(item)}}
                                            deleteClick={()=>{this._deleteFlight(item)}}
                                            showBtn={showBtn}
                                        />
                                )}
                            })
                        }
                    </View>
                </View>
                :null}
                {_intlFlight?
                <View style={styles.itemStyle}>
                    <TextViewTitle title={'港澳台及国际机票信息'} imgIcon={require('../../res/Uimage/shu.png')}/>
                    <View style={{paddingBottom:15}}>
                    {
                        OrderItems.map((item,index)=>{
                            if( item.Category === CommonEnum.orderIdentification.intlFlight ){
                            return(
                                    <IntlFlightView item={item} Travellers={baseInfo.Travellers} Status={baseInfo.Status} key={index} airPortData={airPortData} AirLineArr={AirLineArr}
                                        callback={ ()=>{this._IntlflightDetail(item)} }
                                        deleteClick={()=>{this._deleteFlight(item)}}
                                        showBtn={showBtn}
                                    />
                            )}
                        })
                    }
                    </View>
                </View>
                :null}
                {_train?
                <View style={styles.itemStyle}>
                    <TextViewTitle title={'火车票信息'} imgIcon={require('../../res/Uimage/shu.png')}/>
                    <View style={{paddingBottom:15}}>
                    {
                        OrderItems.map((item,index)=>{
                            if( item.Category === CommonEnum.orderIdentification.train ){
                            return(
                                    <TrainView  item={item} Status={baseInfo.Status} key={index}
                                        callback={()=>{this._TrainDetail(item)}}
                                        deleteClick={()=>{this._deleteFlight(item)}}
                                        showBtn={showBtn}
                                    />
                            )}
                        })
                    }
                    </View>
                </View>
                :null}
                {_hotel?
                <View style={styles.itemStyle}>
                    <TextViewTitle title={'国内酒店信息'} imgIcon={require('../../res/Uimage/shu.png')}/>
                    <View style={{paddingBottom:15}}>
                    {
                        OrderItems.map((item,index)=>{
                            if( item.Category === CommonEnum.orderIdentification.hotel ){
                            return(
                                    <HotelView item={item} Status={baseInfo.Status} key={index}
                                        callback={()=>{this._HotelDetail(item)}}
                                        deleteClick={()=>{this._deleteFlight(item)}}
                                        guaranteedCallback={()=>{this.GuaranteedCallback(item)}}
                                        needCvvCallback={()=>{this._needCvvCallback(item)}}
                                        showBtn={showBtn}
                                    />
                            )}
                        })
                    }
                    </View>
                </View>
                :null}
                {_intlHotel?
                <View style={styles.itemStyle}>
                    <TextViewTitle title={'港澳台及国际酒店信息'} imgIcon={require('../../res/Uimage/shu.png')}/>
                    <View style={{paddingBottom:15}}>
                    {
                        OrderItems.map((item,index)=>{
                            if( item.Category === CommonEnum.orderIdentification.intlHotel ){
                            return(
                                    <IntlHotelView item={item} Status={baseInfo.Status} key={index}
                                        callback={()=>{this._InflHotelDetail(item)}}
                                        deleteClick={()=>{this._deleteFlight(item)}}
                                        //IntlGuaranteedCallback
                                        IntlGuaranteedCallback={()=>{this.IntlGuaranteedCallback(item)}}
                                        needCvvCallback={()=>{this._needCvvCallbackIntl(item)}}
                                        showBtn={showBtn}
                                    />
                            )}
                        })
                    }
                    </View>
                </View>
                :null}
                {
                    _other?
                    <View style={styles.itemStyle}>
                        <TextViewTitle title={'其他订单'} imgIcon={require('../../res/Uimage/shu.png')}/>
                        <View style={{paddingBottom:15}}>
                        {     
                          OrderItems.map((item,index)=>{
                            if( item.Category === CommonEnum.orderIdentification.other ){
                                let itemDesc =item?.InternalOrder?.ProductCode == 9 ? (Util.Parse.isChinese()? item?.InternalOrder?.SpecialTypeName : item?.InternalOrder?.SpecialTypeEnName) : '其他';
                                return(
                                    <View style={styles.borderStyle}>
                                        <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                                            <CustomText style={{ color:Theme.commonFontColor}} text={itemDesc} />
                                            <CustomText style={{color:Theme.assistFontColor ,fontSize:12}} text={item?.InternalOrder?.StatusDesc} />
                                        </View>
                                        <View style={{backgroundColor:Theme.greenLine,height:1,marginVertical:10}}/>
                                        <View style={{flexDirection:'row'}}>
                                            <CustomText style={{ color:Theme.commonFontColor }} text={'出行人'} />
                                            <CustomText style={{ color:Theme.commonFontColor}} text={'：'} />
                                            <CustomText style={{ }} text={item?.InternalOrder?.OrderTravellerDesc} />
                                        </View>
                                    </View>
                                )
                            }})
                        }
                        </View>  
                    </View>
                    :null
                }
            </View>
        )
    }
    
    _needCvvCallbackIntl=(item)=>{
        this.push('CvvScreen', {OrderId: item.InternalOrderId, from:'isIntl' })
    }
    _needCvvCallback=(item)=>{
        this.push('CvvScreen', {OrderId: item.InternalOrderId})
    }

    _flightDetail = (item)=>{
        const { customerInfo_userInfo } = this.props;
       this.push('FlightOrderDetail', {Id: item.InternalOrderId, userInfoId:customerInfo_userInfo?.userInfo?.Id})  
    }
    _IntlflightDetail=(item)=>{
       this.push('IntlFlightOrderDetail', {order: item.InternalOrderId})  
    }
    _deleteFlight = (item)=>{
        let model = { OrderItemId: item.Id};
        this.showAlertView('是否删除该单元项？', () => {
            return ViewUtil.getAlertButton('取消', () => {
                this.dismissAlertView();
            }, '确定', () => {
                this.dismissAlertView();
                this.showLoadingView();
                ComprehensiveService.MassOrderDeleteOrderItem(model).then(response => {
                    this.hideLoadingView();
                    if (response && response.success) {
                        this.toastMsg('删除成功');
                        this._loadDetailData()
                    } else {
                        this._loadDetailData()
                        // this.toastMsg(response.message);
                    }
                }).catch(error => {
                    this.hideLoadingView();
                    this.toastMsg(error.message);
                })   
            })
        })

    }
    _TrainDetail = (item)=>{
       this.push('TrainOrderDetailScreen',{Id:item.InternalOrderId})
    }
    _HotelDetail = (item)=>{
        this.push('HotelOrderDetailScreen', {OrderId: item.InternalOrderId})
    }
    GuaranteedCallback = (item)=>{
        this.push('HotelGuranteeMessageVertify',{OrderId:item.InternalOrderId,CreditCard : null,});
        // this.push('HotelGuarantee', { OrderId: item.InternalOrderId ,isIntl:false,isUnionPay:item.InternalOrder&&item.InternalOrder.Guarantee.IsUnionPay});
    }
    IntlGuaranteedCallback = (item)=>{
        this.push('HotelGuranteeMessageVertify',{OrderId:item.InternalOrderId,CreditCard : null,isIntl:true});
        // this.push('HotelGuarantee', { OrderId: item.InternalOrderId ,isIntl:true});
    }
    _InflHotelDetail = (item)=>{
        this.push('InterHotelOrderDetail',{orderId:item.InternalOrderId});
    }
    /**
     * 联系人信息
     */
    _linkManInfo =()=>{
        const { baseInfo,emailArrStr } = this.state;
        if(!baseInfo){return}
        return(
            baseInfo.Status===10?null://Status===10是已取消状态
            <View style={{backgroundColor:'#fff',marginTop:10,marginHorizontal:10,borderRadius:6,paddingVertical:10,paddingHorizontal:20}}>
                <TitleView2 required={true} title={'联系人信息'}  style={{}}></TitleView2>
                {/* <Bt_inputView dicKey={'姓名'}
                                required={true} 
                                bt_text={baseInfo.Contact&&baseInfo.Contact.Name} 
                                _placeholder={'姓名'} 
                                _callBack={(text)=>{
                                    baseInfo.Contact={
                                        Name:text,
                                        ContactID:baseInfo.Contact&&baseInfo.Contact.ContactID,
                                        Email:baseInfo.Contact&&baseInfo.Contact.Email,
                                        Mobile:baseInfo.Contact&&baseInfo.Contact.Mobile,
                                    }
                                    this.setState({});
                                }}
                 /> */}
                <Bt_inputView dicKey={'手机号'}
                                required={true} 
                                bt_text={baseInfo.Contact&&baseInfo.Contact.Mobile&&baseInfo.Contact.Mobile.replace(/(\d{3})(\d{4})(\d{4})/,"$1****$3")} 
                                _placeholder={'手机号'} 
                                keyboardType='numeric' 
                                _callBack={(text)=>{
                                    baseInfo.Contact={
                                        // Name:baseInfo.Contact&&baseInfo.Contact.Name,
                                        ContactID:baseInfo.Contact&&baseInfo.Contact.ContactID,
                                        Email:baseInfo.Contact&&baseInfo.Contact.Email,
                                        Mobile:text
                                    }
                                    this.setState({});
                                }}
                 />
                {/* <Bt_inputView dicKey={'E-mail'} 
                            bt_text={baseInfo.Contact&&baseInfo.Contact.Email} 
                            _placeholder={'邮箱'} 
                            _callBack={(text)=>{
                                    baseInfo.Contact={
                                        Name:baseInfo.Contact&&baseInfo.Contact.Name,
                                        ContactID:baseInfo.Contact&&baseInfo.Contact.ContactID,
                                        Email:text,
                                        Mobile:baseInfo.Contact&&baseInfo.Contact.Mobile
                                    }
                                    this.setState({}) 
                            }}
                            required={true}
                /> */}
                <Bt_inputView dicKey={'Email'}
                            required={false} 
                            bt_text={emailArrStr} 
                            _placeholder={'请输入电子邮箱'} 
                            _callBack={(text)=>{
                                    baseInfo.Contact={
                                        // Name:baseInfo.Contact&&baseInfo.Contact.Name,
                                        ContactID:baseInfo.Contact&&baseInfo.Contact.ContactID,
                                        Email:text,
                                        Mobile:baseInfo.Contact&&baseInfo.Contact.Mobile
                                    }
                                    
                                    this.setState({emailArrStr:text});
                            }}
                />
                <CustomText text={'支持最多 4 个邮箱，需用英文分号（;）分隔'} style={{marginRight:10,color:Theme.assistFontColor}}></CustomText>
            </View>
        )
    }
    _linkManInfoText =()=>{
        const { baseInfo } = this.state;
        return(
            <View style={{backgroundColor:'#fff',marginHorizontal:10,marginTop:10,borderRadius:6,paddingBottom:6}}>
                <TextViewTitle title={'联系人信息'} imgIcon={require('../../res/Uimage/shu.png')}/>
                {/* <TextView name={'联系人'} value={baseInfo&&baseInfo.Contact&&baseInfo.Contact.Name}/> */}
                <TextView name={'电话'} value={baseInfo?.Contact?.Mobile?.replace(/(\d{3})(\d{4})(\d{4})/,"$1****$3")}/>
                {baseInfo&&baseInfo.Contact&&baseInfo.Contact.Email&&<TextView name={'邮箱'} value={baseInfo&&baseInfo.Contact&&baseInfo.Contact.Email}/>}
            </View>
        )  
    }
    _addMassegeText=()=>{
        const { baseInfo } = this.state;
        let DictItemList =  baseInfo.AdditionInfo&&baseInfo.AdditionInfo.DictItemList
        return(
            <View style={{backgroundColor:'#fff', marginTop:10,marginHorizontal:10,borderRadius:6,paddingBottom:6}}>
                <TextViewTitle title={'附加信息'} imgIcon={require('../../res/Uimage/shu.png')}/>
                {
                    DictItemList&&DictItemList.map((item,index)=>{
                         if(!item.ItemName && !item.ItemInput) return null;
                        return(
                            <TextView 
                                name={Util.Parse.isChinese()? item.DictName: item.DictEnName?item.DictEnName:item.DictName} 
                                value={item.ItemInput?item.ItemInput:Util.Parse.isChinese()? item.ItemName:item.ItemEnName?item.ItemEnName:item.ItemName} 
                                key={index}
                            />
                        )
                    })
                }
            </View>
        )  
    }
    /**
     * 附加信息
     */
     _addMassege=()=>{
         const { baseInfo, customerInfo,profileArr,applyAddtionInfo,PdfDictList,fileList } = this.state;
         if(!baseInfo){return}
         let haveHotel = false;
         baseInfo.OrderItems&&baseInfo.OrderItems.forEach(item => {
             if(item.Category == 4 || item.Category == 6){//业务包含国内酒店或者国际酒店时
                 haveHotel = true;
             }
         })    
         let DicList1 = []
         if(baseInfo.AdditionInfo&&baseInfo.AdditionInfo.length>0 && baseInfo.ApplyId==0){
            baseInfo.AdditionInfo={
                DictItemList:baseInfo.AdditionInfo&&baseInfo.AdditionInfo.DictItemList
            }
         }else if(applyAddtionInfo&&applyAddtionInfo.DictItemList&&applyAddtionInfo.DictItemList.length>0 && baseInfo.ApplyId > 0){
            applyAddtionInfo.DictItemList&&applyAddtionInfo.DictItemList.forEach(item => {
                let index = profileArr.findIndex(e => e.DictId
                    == item.DictId
                )
                if (index > -1){
                    // profileArr[index].DictId = item.DictId
                    // profileArr[index].Id = item.DictId
                    profileArr[index].Code = item.DictCode
                    profileArr[index].EnName = item.DictEnName
                    profileArr[index].FormatRegexp = item.FormatRegexp
                    profileArr[index].ItemName = item.ItemName
                    profileArr[index].ItemInput = item.ItemInput
                    profileArr[index].ItemId = item.ItemId
                    profileArr[index].EnName= item.EnName
                    profileArr[index].ItemEnName = item.ItemEnName
                    profileArr[index].ItemSerialNumber = item.ItemSerialNumber
                    profileArr[index].NeedInput = item.NeedInput
                    profileArr[index].NextId = item.NextId
                    profileArr[index].Remark = item.Remark
                    profileArr[index].RemarkNo = item.RemarkNo
                    profileArr[index].IsShowWhenMissingHotelUnitInMassOrder = item.IsShowWhenMissingHotelUnitInMassOrder
                    // profileArr[index].ShowInOrder = item.ShowInOrder
                }
                DicList1 = profileArr
                baseInfo.AdditionInfo={
                    DictItemList:profileArr
                }
            })
         } else if(customerInfo&&customerInfo.DictList){
            baseInfo.AdditionInfo={
                DictItemList:profileArr
            }
         }
         let NoApproval = true
         if(baseInfo.OrderItems && baseInfo.OrderItems.length>0){
            baseInfo.OrderItems.map((item,index)=>{
                if(item.Category === CommonEnum.orderIdentification.flight || item.Category === CommonEnum.orderIdentification.train || item.Category === CommonEnum.orderIdentification.intlFlight){
                    NoApproval = false
                }
            })
         }
         return(
            baseInfo.Status===10?null:
            <View style={{backgroundColor:'#fff',marginTop:10,marginHorizontal:10,borderRadius:6,paddingVertical:5}}>
                 <TextViewTitle title={'附加信息'} imgIcon={require('../../res/Uimage/shu.png')}/>
                 <CompAdditionInfoView
                        customerInfo={customerInfo}
                        AdditionIfo={baseInfo.AdditionInfo}
                        // DicList1 = {DicList1}
                        fromNo = {128}//综合订单Profile数值  BusinessCategory
                        PdfDictList={fileList&&fileList.length>0 ? PdfDictList :null}
                        NoApproval={NoApproval}
                        haveHotel={haveHotel}
                 />
            </View>
         )
     }
     _approvalChoose = () => {
        const { baseInfo } = this.state;
        if(!baseInfo?.ApprovalModel?.Steps?.length){return}
        return(
            <View style={{backgroundColor:'#fff',marginHorizontal:10,borderRadius:6,marginTop:10}}>
                    <TextViewTitle title={'审批信息'} imgIcon={require('../../res/Uimage/shu.png')}/>
                    {
                        baseInfo.ApprovalModel?.Steps?.map((item,index)=>{
                            if(this.params.approve){
                                item.approvalPerson = item.Persons?.[0];
                            }
                            return(
                                <View style={{ flex: 6,height:48,justifyContent:'center' ,flexDirection:'row',paddingHorizontal:10,borderBottomWidth:1,borderBottomColor:Theme.lineColor,alignItems:'center',justifyContent:'center'}}>
                                    <TouchableOpacity style={{flex: 7,flexDirection:'row'}} disabled={this.params.approve?true:false} onPress={this._toSelecApproval.bind(this,item,index)}>
                                        <View style={{ flex: 3, height:40, paddingTop:10,fontSize:14,flexDirection:'row'}}>
                                            <CustomText text={index+1} style={{ fontSize:14}} />
                                            <CustomText text={'级审批人'} style={{fontSize:14}} />
                                        </View>
                                        <CustomText text={item.approvalPerson&&item.approvalPerson.Name} numberOfLines={2} style={{flex: 7, height:46, paddingTop:10,width:10}}/>
                                    </TouchableOpacity>
                                    <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} style={{height:40,paddingTop:9}} />
                                </View>
                            )
                        })
                    }
            </View>
        )
     }

     _toSelecApproval=(item,index)=>{
        let personList = [];
        item.Persons.map((obj)=>{
            personList.push(obj.Id)
        })
        NavigationUtils.push(this.props.navigation, 'ChooseSinglePersonList', {
            title: '选择审批人',
            personList: personList,
            approvalCallBack: (data) => {
                item.approvalPerson = {
                    level:index+1,
                    Id:data.id,
                    Name:data.text,
                    extendtext:data.extendtext
                }
                this.setState({});
            }
        })
     }

    _button = ()=>{
        const { baseInfo } = this.state
        const { customerInfo_userInfo } = this.props
        if(!baseInfo){return}
        let showBtn = true;
        customerInfo_userInfo.userInfo.Id==baseInfo.Creator.Id ? showBtn=true : showBtn=false;
        // let TradeNumber= baseInfo.PaymentInfos&&baseInfo.PaymentInfos[0]&&baseInfo.PaymentInfos[0].TradeNumber
        let TradeNumber;
        baseInfo.PaymentInfos&&baseInfo.PaymentInfos.map((item)=>{
            if(item.TradeNumber){
                TradeNumber = item.TradeNumber
            }
        })

        return(
            baseInfo.Status===10||baseInfo.Status===4||baseInfo.Status===3?null:
            <View>
                <View style={{flexDirection:'row',justifyContent:'space-around',backgroundColor:"#fff",alignItems:'center',height:70}}>
                    {
                       baseInfo.Status===6?
                            <TouchableOpacity style={styles._btnStyle2}
                                onPress={()=>{this._cancelClick()}}
                            >
                            <CustomText text='取消订单' style={{color:Theme.theme,fontSize:16}}/>
                            </TouchableOpacity>
                       :null
                    }
                    {
                        baseInfo.Status===6?
                            <TouchableOpacity style={styles.btnStyle} onPress={()=>{
                                this.push('CompPaymentScreen',{TradeNumber:TradeNumber,OrderItems:baseInfo.OrderItems,Travellers:baseInfo.Travellers})
                            }}>
                            <CustomText text='付款' style={{color:'#fff',fontSize:16}}/>
                            </TouchableOpacity>
                        :null 
                    }
                    {
                       (baseInfo.Status === 0)&& showBtn? 
                            <TouchableOpacity style={styles._btnStyle2}
                                            onPress={()=>{
                                                this.props.setApply();
                                                if(this.state.baseInfo.ApplyId==0){
                                                    this.setState({
                                                        noApply:true
                                                    })
                                                }else{
                                                    this._getApplyInfo(this.state.baseInfo);
                                                }
                                                this.setState({isAlertAhow:true})
                                            }}
                            >                
                             <CustomText text='更多操作' style={{color:Theme.theme,fontSize:16}}/>
                            </TouchableOpacity>
                        :null
                    }
                    {
                       (baseInfo.Status === 0) && showBtn? 
                            <TouchableOpacity style={styles._btnStyle}
                                            onPress={()=>{this._submitOrder()}}
                            >                
                             <CustomText text='提交订单' style={{color:'#fff',fontSize:16}}/>
                            </TouchableOpacity>
                        :null
                    }
                </View>
            </View>
        )
    }

    _testAlert = () => {
        return(
          <View  style={{position:'absolute',bottom:0, height:global.screenHeight, width:global.screenWidth}}>
            <View style={styles.container2}>
                <TouchableOpacity style={styles.popStyle} activeOpacity={1} onPress={()=>{this.setState({isAlertAhow:false})}}>
                    <TouchableOpacity style={{width:'100%',height:'60%',backgroundColor:'#fff'}} onPress={()=>{}} activeOpacity={1}>
                        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',margin:20}}>
                            <CustomText text={'下一步'} style={{fontSize:15,fontWeight:'bold'}}/>
                            <TouchableOpacity onPress={()=>{this.setState({isAlertAhow:false})}}>
                            {/* <Ionicons name='close-circle' size={15} color={Theme.darkColor} style={{marginLeft:10}}></Ionicons> */}
                            <Ionicons name={'chevron-forward'} size={22} color={Theme.promptFontColor} />
                            </TouchableOpacity>
                        </View>
                        <View style={{width:'100%',height:1,backgroundColor:Theme.lineColor}}></View>
                        <CustomText text={'添加其他产品'} style={{fontSize:12,color:Theme.assistFontColor,marginTop:10,marginLeft:20}}/>
                        {
                        this.state.optionList.length>0 && this.state.optionList?.map((item,index)=>{
                                return (
                                    <TouchableOpacity onPress={()=>{this._handlePress(item,index)}} style={{padding:20,paddingLeft:30,alignItems:'center',flexDirection:'row'}}>
                                        <Image source={item.image} style={{width:20,height:20}}/>
                                        <CustomText text={item.Value} style={{marginLeft:15,fontSize:14}}/>
                                    </TouchableOpacity>
                                )
                            })
                        }
                        <View style={{width:'100%',height:1,backgroundColor:Theme.lineColor}}></View>
                        <CustomText text={'订单操作'} style={{fontSize:12,color:Theme.assistFontColor,marginVertical:10,marginLeft:20}}/>
                        <View style={{flexDirection:'row',justifyContent:'space-around'}}>
                            <TouchableOpacity style={[styles._btnStyleNext,{backgroundColor:'#fff',borderColor:Theme.theme,borderWidth:1}]}
                                onPress={()=>{this._cancelClick()}}
                            >
                            <CustomText text='取消订单' style={{color:Theme.theme,fontSize:16}}/>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </View>
          </View>
        )
      }

    _handlePress=(obj,index)=>{
        this.setState({
            isAlertAhow:false
        })
        const { baseInfo,noApply,apply,goCityDisplay,arrivalCityDisplay,BeginTime,EndTime,goCityDisplay2,arrivalCityDisplay2,option} = this.state;
        let item = option[index];
        this._findTravellersInOrder(item);
        const {comp_userInfo,onLoadcomprehensiveData} = this.props;
        let employeesList = [];
        let travelersList = [];
        baseInfo.Travellers.map((item)=>{
            if(item.PassengerOrigin.Type == 1){
                employeesList.push(item);
            }else{
                travelersList.push(item);
            }
        })
        let IdModel = {
            ReferenceEmployeeId:baseInfo.ReferenceEmployeeId,
            ReferencePassengerId:baseInfo.ReferencePassengerId,
        }
        employeesList&&employeesList.map((item)=>{
            item.shareRoomSelect = false
        })
        travelersList&&travelersList.map((item)=>{
            item.shareRoomSelect = false
        })
        onLoadcomprehensiveData(comp_userInfo.userInfo,employeesList,travelersList,baseInfo.ProjectId,baseInfo.ReferenceEmployeeId,IdModel,baseInfo.ReferencePassengerId)
        let goCity=goCityDisplay;
        let arrivalCity=arrivalCityDisplay ;
        let bCategory;
        let beginTime = BeginTime;
        let endTime = EndTime;
        let cityList = [goCityDisplay,arrivalCityDisplay];
        let cityList2 = [goCityDisplay2,arrivalCityDisplay2];
        if(item==='国内机票'){
            if(goCityDisplay){
                goCity={
                    Code:goCityDisplay.IataCode,
                    Name:goCityDisplay.Name,
                    EnName:goCityDisplay.EnName,
                    Province:goCityDisplay.ProvinceName,
                    Letters:goCityDisplay.Letters,
                    Hot:goCityDisplay.Hot
                }
            }
            if(arrivalCityDisplay){
                arrivalCity = {
                    Code:arrivalCityDisplay.IataCode,
                    Name:arrivalCityDisplay.Name,
                    EnName:arrivalCityDisplay.EnName,
                    Province:arrivalCityDisplay.ProvinceName,
                    Letters:arrivalCityDisplay.Letters,
                    Hot:arrivalCityDisplay.Hot
                }
            }
            if(!(apply&&apply.BusinessCategory&1)){
                cityList = null;
                goCity=null;
                arrivalCity=null ;
                beginTime = null;
                endTime = null;
                bCategory=true
                this.props.setApply();
            }
            this.push('FlightSearchIndex',{selectItem:baseInfo,noApply,SerialNumber:apply&&apply.SerialNumber,goCityDisplay:goCity,arrivalCityDisplay:arrivalCity,bCategory,BeginTime:beginTime,EndTime:endTime});
        }else if (item==='国内酒店'){
            if(!(apply&&apply.BusinessCategory&4)){
                cityList = null;
                goCity=null;
                arrivalCity=null ;
                beginTime = null;
                endTime = null;
                bCategory=true
                this.props.setApply();
            }
            DeviceEventEmitter.emit('HotelSearchLs', { //
                isIntl: false,
                selectTap:4,
                noApply,
                arrivalCityDisplay:arrivalCity,
                BeginTime:beginTime,
            });
            this.push('HotelSearchIndex', { isIntl: false,noApply ,SerialNumber:apply&&apply.SerialNumber,cityList:cityList,goCityDisplay:goCity,arrivalCityDisplay:arrivalCity,bCategory,BeginTime:beginTime,EndTime:endTime});
        }else if (item==='港澳台及国际机票'){
            if(goCityDisplay2){
                goCity = {
                    CityCode:goCityDisplay2.IataCode,
                    CityEg:goCityDisplay2.EnName,
                    CityEnName:goCityDisplay2.EnName,
                    CityName:goCityDisplay2.Name,
                    Cname:goCityDisplay2.Name,
                    NationalCode:goCityDisplay2.NationalCode,
                    NationalEg:goCityDisplay2.EnNationalName,
                    NationalName:goCityDisplay2.NationalName,
                }
            }
            if(arrivalCityDisplay2){
                arrivalCity = {
                    CityCode:arrivalCityDisplay2.IataCode,
                    CityEg:arrivalCityDisplay2.EnName,
                    CityEnName:arrivalCityDisplay2.EnName,
                    CityName:arrivalCityDisplay2.Name,
                    Cname:arrivalCityDisplay2.Name,
                    NationalCode:arrivalCityDisplay2.NationalCode,
                    NationalEg:arrivalCityDisplay2.EnNationalName,
                    NationalName:arrivalCityDisplay2.NationalName,
                }
            }
            if(!(apply&&apply.BusinessCategory&8)){
                cityList = null;
                goCity=null;
                arrivalCity=null ;
                beginTime = null;
                endTime = null;
                bCategory=true
                this.props.setApply();
            }
            DeviceEventEmitter.emit('HotelSearchLs', { //
                isIntl: false,
                selectTap:4,
                noApply,
                arrivalCityDisplay:arrivalCity,
                BeginTime:beginTime,
            });
            this.push('IntlFlightIndex',{noApply:noApply,SerialNumber:apply&&apply.SerialNumber,goCityDisplay:goCity,arrivalCityDisplay:arrivalCity,bCategory:bCategory,BeginTime:beginTime,EndTime:endTime});
        }else if (item==='港澳台及国际酒店'){
            if(!(apply&&apply.BusinessCategory&16)){
                cityList2 = null;
                goCity=null;
                arrivalCity=null ;
                beginTime = null;
                endTime = null;
                bCategory=true
                this.props.setApply();
            }
            DeviceEventEmitter.emit('HotelSearchLs', { //
                isIntl: true,
                selectTap:6,
                noApply,
                cityList:cityList2,
                BeginTime:beginTime,
            });
            this.push('HotelSearchIndex', { isIntl: true ,selectTap:6,noApply,SerialNumber:apply&&apply.SerialNumber,cityList:cityList2,bCategory,BeginTime:beginTime,EndTime:endTime});
        }else if (item==='火车票'){
            if(!(apply&&apply.BusinessCategory&2)){
                cityList = null;
                goCity=null;
                arrivalCity=null ;
                beginTime = null;
                endTime = null;
                bCategory=true
                this.props.setApply();
            }
                beginTime = null;
            this.push('TrainIndexScreen',{noApply,SerialNumber:apply&&apply.SerialNumber,goCityDisplay:goCity,arrivalCityDisplay:arrivalCity,bCategory,BeginTime:beginTime,EndTime:endTime});
        }else if (item==='用车'){
            this.toastMsg('您的申请单类目不支持预订用车');
        }


       
    }

    _findTravellersInOrder = (item)=>{
        const {baseInfo} = this.state;
            if(baseInfo.OrderItems){
                let orderItem =  baseInfo.OrderItems.find(obj=>obj.CategoryDesc == item);
                if(orderItem && orderItem.InternalOrder && orderItem.InternalOrder.Travellers){
                    orderItem.InternalOrder.Travellers.forEach(obj=>{
                        let traveller =  baseInfo.Travellers.find(traveller=>{
                            return (obj.PassengerOrigin.Type==1 && (obj.PassengerOrigin.EmployeeId=== traveller.PassengerOrigin.EmployeeId)) || (obj.PassengerOrigin.Type==2 && (obj.PassengerOrigin.TravellerId=== traveller.PassengerOrigin.TravellerId))
                        });
                        if(traveller){
                            if((!traveller.Certificates || traveller.Certificates == 0) && obj.Certificate){
                                traveller.Certificates =  [obj.Certificate];
                            }
                        }
                })
            }
        }
        //点击继续预订时，先把当前综合订单的人Travellers存入redux
        const { setComp_travellers ,setComp_Id, onClickSure} = this.props;
        let compEmployees = []
        let compTraveler = []
        if(baseInfo.Travellers){
            baseInfo.Travellers.map((item)=>{
                let user = UserInfoUtil.getCompUser(item);
                if(item.PassengerOrigin.Type===1){
                    compEmployees.push(user);
                }else{
                    compTraveler.push(user);
            }
            })
        }
        setComp_travellers(compEmployees,compTraveler,baseInfo);

        setComp_Id(baseInfo.Id)

        onClickSure(false)//点击继续预订时将判断是否是创建订单的值改为否

    }
    
    /**
     * 取消综合订单
     */
    _cancelClick =()=>{
        this.showAlertView('您确定要取消此订单吗？此操作不可撤销。', () => {
            return ViewUtil.getAlertButton('取消', () => {
                this.dismissAlertView();
            }, '确定', () => {
                this.dismissAlertView();
                const { orderId } = this.params;
                let model = {
                    OrderId:orderId
                }
                this.showLoadingView()
                ComprehensiveService.MassOrderCancel(model).then(response => {
                this.hideLoadingView() 
                    if (response && response.success) {
                        NavigationUtils.popToTop(this.props.navigation);
                        DeviceEventEmitter.emit('BackRefreshList', {});
                    }else{
                        this.toastMsg(response.message);
                    }
                }).catch(error => {
                    this.hideLoadingView()  
                    this.toastMsg(error.message || '加载数据失败请重试');
                })
            })
        }) 
    }
    /**
     *  渲染审批按钮
     */
    _renderApproveBtn = (order) => {
        const { baseInfo } = this.state;
        if(!baseInfo){return}
        let time =baseInfo.CreateTime.substr(5,11);
        time = time.replace('T',' ')
        return(
            baseInfo.ApprovalModel?
                <View style={{ backgroundColor:'#fff',marginHorizontal:10,padding:20,borderRadius:6,marginTop:10}}>
                    <View style={{flexDirection:'row',alignItems:'center',paddingBottom:10,borderBottomWidth:1,borderColor:Theme.lineColor,marginBottom:20}}>
                            <Image source={require('../../res/Uimage/shu.png')} style={{width:14,height:14}}/>
                            <CustomText text='审批记录' style={{fontWeight:'bold'}} />
                    </View>
                    <View style={{ flexDirection:'row' }}>
                        <View style={{alignItems:'center'}}>
                            <View style={{width:20,alignItems:'center',justifyContent:'center'}}>
                            <Image style={{ width:20, height:20}} source={require('../../res/Uimage/dot_.png')} />
                            </View>
                            { <View style={{height:48,
                                width:1,
                                backgroundColor:baseInfo?.ApprovalModel?.Steps?.length ? Theme.theme : '#fff',
                                marginTop:-1}}>
                                </View>
                            }
                        </View> 
                        <View style={{flex:1,marginLeft:20}}>
                            <View style={{ flexDirection:'row',justifyContent:'space-between'}} >
                                <View style={{flexDirection:'row'}}>
                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'预订人'} />
                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={baseInfo.Creator.Name} />
                                </View>
                                <CustomText style={{ color:baseInfo.Status==0 ? Theme.theme: Theme.assistFontColor, fontSize: 14 }} text={'提交申请'} />
                            </View>   
                            <Text allowFontScaling={false} style={{ color: Theme.promptFontColor, fontSize: 14,marginTop:5 }}>{time}</Text>
                        </View>
                    </View>
                    
                    {
                        baseInfo.ApprovalModel?.Steps&&baseInfo.ApprovalModel.Steps.map((step,i)=>{
                            // if(step.Level==baseInfo.ApprovalModel.CurrentStep){
                                let approvers = []
                                return(
                                    // <View style={{justifyContent:'center',alignItems:'center'}}>
                                    //     <Image style={{height:25,width:25}} source={require('../../res/image/approval_delay.png')}></Image>
                                    //     <CustomText text={'审批人'} style={styles.textStyle}/>
                                    //     {
                                    //         step.Persons&&step.Persons.map((item)=>{
                                    //             approvers.push(item.Name);
                                    //         })
                                    //     }
                                    //     <CustomText text={approvers.join('、')} style={styles.textStyle2}/>
                                    //     {
                                    //         step.Worked?<CustomText text={'已审批'} style={styles.textStyle2}/>
                                    //         :<CustomText text={'待审批'} style={styles.textStyle2}/>
                                    //     }
                                    // </View>
                                    <View style={{ flexDirection:'row' }}>
                                        <View style={{alignItems:'center'}}>
                                            <View style={{width:20,alignItems:'center',justifyContent:'center'}}>
                                            <Image style={{ width:(step.Worked)? 20 : 10, height: (step.Worked)? 20 : 10 }} source={(!step.Worked)?require('../../res/Uimage/dot.png'):require('../../res/Uimage/dot_.png')} />
                                            </View>
                                            { <View style={{
                                                    height:48,
                                                    width:1,
                                                    backgroundColor: i === (baseInfo.ApprovalModel?.Steps?.length - 1) 
                                                        ? '#fff' 
                                                        : (step?.Worked ? Theme.theme : Theme.lineColor),
                                                    marginTop:-1
                                                }} />
                                            }
                                        </View> 
                                        <View style={{flex:1,marginLeft:20}}>
                                            <View style={{ flexDirection:'row',marginTop:!(!step.Worked|| i==0)?-5:-5 ,justifyContent:'space-between',flexWrap:'wrap'}} >
                                                <Text style={{flexDirection:'row',width:220}}>
                                                <CustomText style={{ color: Theme.fontColor, fontSize: 14 }} text={'审批人'} />
                                                {
                                                    step.Persons&&step.Persons.map((item)=>{
                                                        approvers.push(item.Name);
                                                    })
                                                }
                                                <CustomText style={{ color: Theme.fontColor, fontSize: 14,  }} text={'（'+ approvers.join('、')+'）'} />
                                                {step.Level&&<CustomText style={{ color: Theme.promptFontColor, fontSize: 14 }} text={Util.Parse.isChinese()?'('+ step.Level+'级'+')':'('+'Level-'+step.Level+')' } />}
                                                </Text>
                                                <CustomText style={{ color:!step.Worked? Theme.theme : Theme.assistFontColor, fontSize: 14 }} text={!step.Worked?'待审批':'已审批'} />
                                            </View> 
                                            {/* <Text allowFontScaling={false} style={{ color: Theme.promptFontColor, fontSize: 14,marginTop:5 }}>{(time ? time.format('yyyy-MM-dd') : '') + ' ' + (time ? time.format('HH:mm') : '')}</Text> */}
                                        </View>
                                    </View>
                                )
                            // }
                        })
                    }
                </View>
            :null
        )
    }

    _submitOrder=()=>{
        const{ baseInfo ,customerInfo,profileArr,fileList} = this.state;
        if(!baseInfo){return}
        // NavigationUtils.popToTop(this.props.navigation);
        if(!baseInfo.Contact){
            this.toastMsg('联系人不能为空');
            return
        }else{
            if(!baseInfo.Contact.Mobile){
                this.toastMsg('联系人电话不能为空');
                return;
            }else if(!baseInfo.Contact.Email){
                this.toastMsg('联系人邮箱不能为空');
                return;
            }else{
                let emailArr2 = baseInfo.Contact?.Email?.split(';').filter(item => item);
                if(emailArr2?.length>4){
                   this.toastMsg('联系人邮箱最多维护4个');
                   return;
                }
                if(emailArr2?.length>0){
                    for (const item of emailArr2) {
                        if (!Util.RegEx.isEmail(item)) {
                            this.toastMsg('请输入正确的邮箱格式');
                            return;
                        }
                    }
                }
            }
        }

        let approvalList = [];
        if(baseInfo && baseInfo.WorkflowChooseOneOrAll && baseInfo.WorkflowChooseOneOrAll==1){
            if(baseInfo.ApprovalModel?.Steps?.length > 0 ){
                baseInfo.ApprovalModel.Steps.map((item)=>{
                    if(item.approvalPerson){
                        approvalList.push(item.approvalPerson);
                    }  
                }) 
                if(baseInfo.ApprovalModel.Steps.length>approvalList.length){
                    this.toastMsg('请选择审批人');
                    return;
                }
            }
        }

        const setting = customerInfo.Setting;
        if(setting&&setting.AttachmentConfig&&setting.AttachmentConfig.MassNecessary){
            if(fileList.length==0){
                this.toastMsg('未上传附件');
                return;
            }
        }
        let AttachmentModel = {
            AttachmentItems:fileList
        }

        let NoApproval = true
         if(baseInfo.OrderItems && baseInfo.OrderItems.length>0){
            baseInfo.OrderItems.map((item,index)=>{
                if(item.Category === CommonEnum.orderIdentification.flight || item.Category === CommonEnum.orderIdentification.train || item.Category === CommonEnum.orderIdentification.intlFlight){
                    NoApproval = false
                }
            })
         }

        let haveHotel = false
        baseInfo.OrderItems&&baseInfo.OrderItems.forEach(item => {
             if(item.Category == 4 || item.Category == 6){//业务包含国内酒店或者国际酒店时
                 haveHotel = true;
             }
        })
        if(baseInfo.AdditionInfo){
            const dictItemList = (baseInfo.AdditionInfo && Array.isArray(baseInfo.AdditionInfo.DictItemList)) ? baseInfo.AdditionInfo.DictItemList : [];
            const dictConfigList = (customerInfo && Array.isArray(customerInfo.DictList)) ? customerInfo.DictList : [];
            const dictMapList = (customerInfo && customerInfo.DictMapList) || [];
            const fromNo = 128;

            const findFilledByCfg = (cfg) => {
                if (!cfg || !Array.isArray(dictItemList)) return undefined;
                return dictItemList.find(it => {
                    if (!it) return false;
                    if (cfg.Code !== undefined && cfg.Code !== null && it.DictCode == cfg.Code) return true;
                    return it.DictId == cfg.Id;
                });
            };

            const getVisibleDictIdSet = (configs, mapList, filledList) => {
                var configById = {};
                var childIdSet = new Set();
                (configs || []).forEach(function (cfg) {
                    if (cfg && cfg.Id !== undefined) configById[cfg.Id] = cfg;
                    if (cfg && cfg.NextId) childIdSet.add(cfg.NextId);
                });
                var rootIds = [];
                (configs || []).forEach(function (cfg) {
                    if (cfg && cfg.Id !== undefined && !childIdSet.has(cfg.Id) && cfg.ShowInOrder) rootIds.push(cfg.Id);
                });
                var visibleIdSet = new Set();
                var visiting = new Set();
                var visit = function (id) {
                    if (!id || visibleIdSet.has(id) || visiting.has(id)) return;
                    visiting.add(id);
                    visibleIdSet.add(id);
                    var cfg = configById[id];
                    var nextId = cfg && cfg.NextId;
                    if (nextId) {
                        var parentItem = filledList && filledList.find(function (it) {
                            if (!it) return false;
                            if (cfg && cfg.Code !== undefined && cfg.Code !== null && it.DictCode == cfg.Code) return true;
                            return it.DictId == id;
                        });
                        var parentName = parentItem && parentItem.ItemName;
                        if (!parentName) {
                            visiting.delete(id);
                            return;
                        }
                        var rules = (mapList || []).filter(function (m) { return m && m.DictId == nextId; });
                        if (rules.length === 0) {
                            visit(nextId);
                        } else if (rules.some(function (m) { return m && m.ParentName == parentName; })) {
                            visit(nextId);
                        }
                    }
                    visiting.delete(id);
                };
                rootIds.forEach(function (id) { visit(id); });
                return visibleIdSet;
            };

            const visibleCfgIdSet = getVisibleDictIdSet(dictConfigList, dictMapList, dictItemList);

            const parentByChildId = {};
            dictConfigList.forEach((cfg) => {
                if (cfg && cfg.NextId) parentByChildId[cfg.NextId] = cfg;
            });
            const shownCache = new Map();
            const visitingShown = new Set();
            const isCfgShown = (cfg) => {
                if (!cfg) return false;
                const cfgId = cfg.Id;
                if (!cfgId) return false;
                if (shownCache.has(cfgId)) return shownCache.get(cfgId);
                if (visitingShown.has(cfgId)) return false;
                visitingShown.add(cfgId);
                if (!(cfg.BusinessCategory & fromNo)) {
                    visitingShown.delete(cfgId);
                    shownCache.set(cfgId, false);
                    return false;
                }
                if (cfg.showNext === false) {
                    visitingShown.delete(cfgId);
                    shownCache.set(cfgId, false);
                    return false;
                }
                const showNext = cfg.showNext === true ? true : visibleCfgIdSet.has(cfgId);
                if (!showNext) {
                    visitingShown.delete(cfgId);
                    shownCache.set(cfgId, false);
                    return false;
                }
                const parentCfg = parentByChildId[cfgId];
                const shown = parentCfg ? isCfgShown(parentCfg) : !!cfg.ShowInOrder;
                visitingShown.delete(cfgId);
                shownCache.set(cfgId, shown);
                return shown;
            };

            if (customerInfo.CustomerHandleName === "Ontheway.TMC.CustomerHandlers.Shell.ShellHandler" && customerInfo.selectedNeed && !NoApproval) {
                const approvalCfg = dictConfigList.find(c => c && c.Name === "approver's email address");
                if (approvalCfg && isCfgShown(approvalCfg)) {
                    const approvalFilled = findFilledByCfg(approvalCfg);
                    if (!approvalFilled || !approvalFilled.ItemName) {
                        this.toastMsg('请输入审批人邮箱');
                        return;
                    }
                }
            }

            for (let i = 0; i < dictConfigList.length; i++) {
                const cfg = dictConfigList[i];
                if (!isCfgShown(cfg)) continue;
                const filled = findFilledByCfg(cfg);
                const title = cfg.Name || cfg.DictName;

                if (cfg.IsRequire && (!haveHotel || !cfg.IsShowWhenMissingHotelUnitInMassOrder)) {
                    if (!filled) {
                        this.toastMsg(title + '不能为空');
                        return;
                    }
                    if (cfg.NeedInput && !filled.ItemName) {
                        this.toastMsg(title + '不能为空');
                        return;
                    }
                    if (!cfg.NeedInput && !filled.ItemId) {
                        this.toastMsg(title + '不能为空');
                        return;
                    }
                }

                const regexp = (filled && filled.FormatRegexp) || cfg.FormatRegexp;
                if (filled && filled.ItemName && regexp) {
                    let regex = new RegExp(regexp);
                    if (!regex.test(filled.ItemName)) {
                        this.toastMsg(I18nUtil.tranlateInsert('{{noun}}格式不符合规则', filled.ItemName));
                        return;
                    }
                }
            }

            const submitAdditionInfo = (() => {
                const raw = baseInfo.AdditionInfo || {};
                const configs = dictConfigList.filter(cfg => cfg && (cfg.BusinessCategory & fromNo));
                const existList = Array.isArray(raw.DictItemList) ? raw.DictItemList : [];
                const nullDictList = configs.map((item) => ({
                    DictCode: item.Code,
                    DictEnName: item.EnName,
                    DictId: item.Id,
                    DictName: item.Name,
                    FormatRegexp: item.FormatRegexp,
                    Id: item.Id,
                    ItemEnName: null,
                    ItemId: "",
                    ItemInput: "",
                    ItemName: "",
                    NeedInput: item.NeedInput,
                    Remark: item.Remark,
                    RemarkNo: item.RemarkNo,
                    NextId: item.NextId,
                    ShowInOrder: item.ShowInOrder,
                    BusinessCategory: item.BusinessCategory,
                }));
                existList.forEach((it) => {
                    if (!it) return;
                    const dictId = it.DictId || it.Id;
                    let idx = -1;
                    if (dictId !== undefined && dictId !== null) {
                        idx = nullDictList.findIndex(e => e && (e.Id == dictId || e.DictId == dictId));
                    }
                    if (idx === -1 && it.DictCode !== undefined) {
                        idx = nullDictList.findIndex(e => e && e.DictCode == it.DictCode);
                    }
                    if (idx > -1) {
                        const base = nullDictList[idx];
                        nullDictList[idx] = {
                            ...base,
                            ...it,
                            Id: base.Id,
                            DictId: base.DictId,
                            DictCode: base.DictCode,
                            DictName: base.DictName,
                            DictEnName: base.DictEnName,
                            NeedInput: base.NeedInput,
                            NextId: base.NextId,
                            ShowInOrder: base.ShowInOrder,
                            FormatRegexp: base.FormatRegexp,
                            Remark: base.Remark,
                            RemarkNo: base.RemarkNo,
                            BusinessCategory: base.BusinessCategory,
                        };
                    }
                });
                const childIdSet2 = new Set();
                configs.forEach((cfg) => {
                    if (cfg && cfg.NextId) childIdSet2.add(cfg.NextId);
                });
                const shownIdSet = new Set();
                configs.forEach((cfg) => {
                    if (isCfgShown(cfg)) shownIdSet.add(cfg.Id);
                });
                return {
                    ...raw,
                    DictItemList: nullDictList.filter((it) => {
                        const id = it && (it.DictId || it.Id);
                        if (!id) return false;
                        if (!childIdSet2.has(id)) return true;
                        return shownIdSet.has(id);
                    }),
                };
            })();

            baseInfo.AdditionInfo = submitAdditionInfo;
        }
        let model={
            Id: baseInfo.Id,
            SerialNumber: baseInfo.SerialNumber,
            Customer: baseInfo.Customer,
            Category: baseInfo.Category,
            ServiceCharge: baseInfo.ServiceCharge,
            Remark: baseInfo.Remark,
            Status: baseInfo.Status,
            FeeType: baseInfo.FeeType,
            RulesTravelId: baseInfo.RulesTravelId,
            Approval: baseInfo.Approval,
            PaymentInfos: baseInfo.PaymentInfos,
            Contact: baseInfo.Contact,
            AdditionInfo: baseInfo.AdditionInfo,
            Creator: baseInfo.Creator,
            CreateTime: baseInfo.CreateTime,
            LastUpdater: baseInfo.LastUpdater,
            LastUpdateTime: baseInfo.LastUpdateTime,
            OrderItems: baseInfo.OrderItems,
            Travellers: baseInfo.Travellers,
            StatusDesc: baseInfo.StatusDesc,
            Amount: baseInfo.Amount,
            ApprovedList: baseInfo.ApprovedList,
            approvers:baseInfo.WorkflowChooseOneOrAll&&baseInfo.WorkflowChooseOneOrAll==1?approvalList:baseInfo.Approvers,
            Attachment:AttachmentModel
           
        }
        this.showLoadingView();
        ComprehensiveService.MassOrderSubmit(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                // this.continuHotel();
                if(response.code==201 && response.data){
                    this.push('CompPaymentScreen',
                        {TradeNumber: response.data.TradeNumber,
                            OrderItems_pay: response.data.OrderItems,
                            OrderItems: baseInfo.OrderItems,
                            Travellers: baseInfo.Travellers
                        }
                     )
                }else{
                    this.showAlertView('综合订单提交成功',()=>{
                        return ViewUtil.getAlertButton("确定",()=>{
                            this.dismissAlertView();
                            NavigationUtils.popToTop(this.props.navigation);
                            InteractionManager.runAfterInteractions(() => {
                                DeviceEventEmitter.emit('deleteApply', {});
                            });
                        })
                    })
                }

            }else{
                this.toastMsg(response.message);
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '加载数据失败请重试');
        })
    }

    continuHotel(){
        const{ baseInfo } = this.state;
        if(!baseInfo){return}
        let flightInfo = baseInfo.OrderItems.find(obj=>obj.Category ==1);
        if(flightInfo){
        let OrderAir = flightInfo.InternalOrder?.OrderAir
        let str = `是否继续预订${Util.Date.toDate(OrderAir.DestinationTime).format('MM-dd')}${OrderAir.Destination}的酒店`;
        this.showAlertView(str, () => {
            return ViewUtil.getAlertButton('暂不预订', () => {
                this.dismissAlertView();
                NavigationUtils.popToTop(this.props.navigation);
                InteractionManager.runAfterInteractions(() => {
                    DeviceEventEmitter.emit('deleteApply', {});
                });
            }, '继续预订酒店', () => {
                this.dismissAlertView();
                let compEmployees = [];
                let compTraveler = [];
                baseInfo.Travellers.map((item)=>{
                    if(item.PassengerOrigin.Type===1){
                        compEmployees.push(item);
                    }else{
                        compTraveler.push(item);
                }
                })
                this.props.setComp_travellers(compEmployees,compTraveler,baseInfo);
                this.push('HotelSearchIndex',{
                    flight:{
                        Destination:OrderAir?OrderAir.Destination:'',
                        DestinationTime: OrderAir ? Util.Date.toDate(OrderAir.DestinationTime) : new Date()
                    }
                });
            })
        })
        }
    }
    renderBody() {
        const { baseInfo,ServiceFeesShow, isAlertAhow } = this.state;
        const { approve } = this.params;
        if(!baseInfo){
            return ViewUtil.PlaceholderDetail()
        }
        let amountAll = baseInfo.Amount
        if(ServiceFeesShow){
            amountAll = baseInfo.Amount+baseInfo.ServiceCharge
        }
        let _serialNumber = I18nUtil.tranlateInsert('订单号：{{noun}}', I18nUtil.translate(baseInfo.SerialNumber))
            //预订方式处理
        let PlatformType = []
        let PlatformString = ''
        if(baseInfo.OrderItems&&baseInfo.OrderItems.length>0){
                baseInfo.OrderItems.map((item)=>{
                    PlatformType.push(item.Platform)
                })            
                //去重
                const res = new Map();
                PlatformType=PlatformType.filter((a) => !res.has(a) && res.set(a, 1))
                PlatformString = PlatformType.join('、')
                // PlatformString = String1+String2;
        }
        //预订时间处理
        var d = new Date(Util.Date.toDate(baseInfo.CreateTime))
        var datetime = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes();
        return(
            <View style={{backgroundColor:'#fff'}}>
            <LinearGradient start={{x: 1, y: 0}} end={{x: 1, y: 0.5}} style={{height:global.screenHeight-110}} colors={[Theme.theme,Theme.normalBg]}>
                {/* <View style={{flexDirection:'row',paddingHorizontal:15,justifyContent:'space-between',height:44,alignItems:'center'}}>
                    <TouchableOpacity onPress={()=>{this._stopBackEvent()}}>
                        <AntDesign name={'arrowleft'} size={20} color={'#fff'} />
                    </TouchableOpacity>
                    <CustomText style={{fontSize:16, color:'#fff'}} text={'综合订单详情'}></CustomText>
                    <CustomText style={{fontSize:16, color:'#fff'}} text={''}></CustomText>
                </View> */}
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={{marginHorizontal:10,backgroundColor:'#fff',borderRadius:6,padding:10,paddingHorizontal:20}}>
                        <View style={{flexDirection:'row',alignItems:'center',height:44,justifyContent:'space-between'}}>
                        <CustomText style={{fontSize:20,fontWeight:'bold'}} text={baseInfo.StatusDesc}></CustomText>
                        <CustomText style={{fontSize:20,fontWeight:'bold'}} text={'￥'+amountAll.toFixed(2)}></CustomText>
                        </View>
                        <View style={{flexDirection:'row',height:34,justifyContent:'space-between',borderBottomWidth:1,borderColor:Theme.themeLine}}>
                        <CustomText style={{color:Theme.commonFontColor}} text={_serialNumber}></CustomText>
                        <CustomText style={{color:Theme.commonFontColor}} text={'合计金额'}></CustomText>
                        </View>
                        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:15}}>
                        <CustomText style={{color:Theme.commonFontColor}} text={'预订人员'}></CustomText>
                        <CustomText style={{color:Theme.commonFontColor}} text={'预订方式'}></CustomText>
                        </View>
                        <View style={{flexDirection:'row',height:24,justifyContent:'space-between',alignItems:'center'}}>
                        <CustomText style={{fontSize:14}} text={baseInfo.Creator&&baseInfo.Creator.Name}></CustomText>
                        <CustomText style={{fontSize:14}} text={PlatformString}></CustomText>
                        </View>
                        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:15}}>
                        <CustomText style={{color:Theme.commonFontColor}} text={'创建时间'}></CustomText>
                        {ServiceFeesShow?<CustomText style={{color:Theme.commonFontColor}} text={'服务费用'}></CustomText>:null}
                        </View>
                        <View style={{flexDirection:'row',height:24,justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                        <CustomText style={{fontSize:14}} text={datetime}></CustomText>
                        {ServiceFeesShow?<CustomText style={{fontSize:14}} text={'￥'+baseInfo.ServiceCharge}></CustomText>:null}
                        </View>
                    </View>
                    {this._flightMessage()}
                    {baseInfo.Status == 0?this._linkManInfo():this._linkManInfoText()}
                    {baseInfo.Status == 0?this._addMassege():this._addMassegeText()}
                    {this._uploadeFile()}
                    {(baseInfo.WorkflowChooseOneOrAll==1 && (baseInfo.Status===0))?this._approvalChoose():this._renderApproveBtn()}
                    {/* {this._approvalChoose()}
                    {/* {this._renderApproveBtn()}  this._rejectConfim.bind(this, baseInfo) */}
                    {this._renderShowBigImage()}           
                 <View style={{height:260}}></View>
                </ScrollView> 
                <View>
                {approve?null:this._button()}
                {
                approve && this.params.approveShow && baseInfo.Status===2? 
                ViewUtil.getTwoBottomBtn('驳回',this._rejectConfim.bind(this, baseInfo),'同意',this._agreeConfim.bind(this, baseInfo),)
                : null
                }
                </View>
                {isAlertAhow ? this._testAlert() : null} 
            </LinearGradient>           
            </View>
        )
    }

    /**
     *  同意的提示
     */
    _agreeConfim = (order) => {
            this.showAlertView(
            () => {
                return (<View style={{ padding: 5, justifyContent: 'center', alignItems: 'center' }}>
                    <CustomText text='请输入同意原因' />
                    <CustomeTextInput onChangeText={text => this.setState({ comment: text })} multiline={true} style={{ height: 60, width: 250, marginTop: 10, borderWidth: 1, borderColor: Theme.lineColor }} />
                </View>)
            },
            () => {
                return ViewUtil.getAlertButton('我再想想', () => {
                    this.dismissAlertView();
                }, '确定同意', () => {
                    this.dismissAlertView();
                    this._approve(order)
                })
            })
    }
    /**
     *  拒绝的提示
     */
    _rejectConfim = (order) => {
            this.showAlertView(() => {
                return (<View style={{ padding: 5, justifyContent: 'center', alignItems: 'center' }}>
                    <HighLight name={'请输入驳回原因'} />
                    <CustomeTextInput onChangeText={text => this.setState({ comment: text })} multiline={true} style={{ height: 60, width: 250, marginTop: 10, borderWidth: 1, borderColor: Theme.lineColor }} />
                </View>)
            }, () => {
                return ViewUtil.getAlertButton('我再想想', () => {
                    this.dismissAlertView();
                }, '确定驳回', () => {
                    this.dismissAlertView();
                    this._reject(order);
                })
            })
    }
    
    _approve = (order) => {
            const { orderId } = this.params;
            const { comment } = this.state;
            let compModel = {
                    OrderId:orderId,//综合订单id
                    Status: 1,
                    Comment:comment
            }
            let promise = promise =  ComprehensiveService.MassOrderApprove2(compModel);
            this.showLoadingView();
            promise.then(response => {
                this.hideLoadingView();
                if (response && response.success) {
                    this.showAlertView('审批成功', () => {
                        return ViewUtil.getAlertButton('确定', () => {
                            this.dismissAlertView();
                            DeviceEventEmitter.emit(Key.ApprovalChange, order);
                            this.pop();
                        })
                    })
                } else {
                    this.toastMsg(response.message || '审批失败,请联系客服');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '获取数据异常');
            })
    
    }
    
    _reject = (order) => {
            const { comment } = this.state;
            const { orderId } = this.params;
            if (!comment) {
                this.toastMsg('驳回原因不能为空');
                return;
            }   
            let compModel = {
                OrderId: orderId,
                Comment: comment,
                Status: 2
            }
            let promise =  ComprehensiveService.MassOrderApprove2(compModel);
            this.showLoadingView();
            promise.then(response => {
                this.hideLoadingView();
                if (response && response.success) {
                    this.showAlertView('驳回成功', () => {
                        return ViewUtil.getAlertButton('确定', () => {
                            this.dismissAlertView();
                            DeviceEventEmitter.emit(Key.ApprovalChange, order);
                            this.pop();
                        })
                    })
                } else {
                    this.toastMsg(response.message || '驳回失败,请联系客服');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.toastMsg(error.message || '获取数据异常');
            })
    }

    _renderShowBigImage = () => {
        return (
            <Modal transparent visible={this.state.visible}>
                <TouchableHighlight style={{ flex: 1 }} underlayColor='transparent' onPress={() => {
                    this.setState({
                        visible: false,
                        showImageUrl: ''
                    })
                }}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: "center", justifyContent: 'center' }}>
                        <Image style={{ width: screenWidth-20, height: screenHeight-20, resizeMode:'contain' }} source={{ uri: this.state.showImageUrl }} />
                    </View>
                </TouchableHighlight>
            </Modal>
        )
    }

    _uploadeFile=()=>{
        const {fileList, customerInfo, baseInfo} = this.state;
        return(
            <View>
                    {
                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.MassContainsAttachment&& baseInfo.Status === 0//判断上传附件是否展示
                        ?
                        <View style={{margin:10,backgroundColor:'#fff',borderRadius:6,paddingBottom:6}}>
                             <View  style={{ flexDirection:'row',alignItems:'center',justifyContent:'space-between' ,marginHorizontal: 20, backgroundColor:'#fff' , borderColor: Theme.lineColor, borderBottomWidth:1,flexWrap:'wrap'}}>
                                    {
                                        customerInfo&&customerInfo.Setting&&customerInfo.Setting.AttachmentConfig&&customerInfo.Setting.AttachmentConfig.MassNecessary?
                                        <View style={{flexDirection:'row',alignItems:'center'}}>
                                            <Image style={{height:15, width:15}} source={require('../../res/Uimage/shu.png')}></Image>
                                        <HighLight name='上传附件' style={{ fontSize:14, fontWeight:'bold',paddingVertical:10 }} />
                                        </View>
                                        :
                                        <TextViewTitle title={'上传附件'} style={{marginLeft:-5,paddingVertical:10}} imgIcon={require('../../res/Uimage/shu.png')}/>
                                    }
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between" }}>
                                        <TouchableOpacity style={[{ borderColor: Theme.theme }, styles.borderAll]} 
                                            onPress={()=>{
                                                this._selectFile()
                                            }}
                                        >
                                            <CustomText text='从文件夹上传' style={{color: Theme.theme }} />
                                        </TouchableOpacity>
                                        {
                                        Platform.OS === 'android'?null:
                                            <TouchableOpacity style={[{ borderColor: Theme.theme,marginLeft:5  }, styles.borderAll]} 
                                                onPress={()=>{
                                                this._selectImage()
                                                }}
                                            >
                                                <CustomText text='打开相册或相机' style={{color: Theme.theme }} />
                                            </TouchableOpacity>}
                                    </View>
                            </View>
                            <View style={{ backgroundColor: 'white', paddingHorizontal: 20,justifyContent:'space-between',marginTop:10}}>
                                    <CustomText text={'单个文件最大5MB，数量最多5个，格式为:'} style={{fontSize:11, color:'red'}} ></CustomText>
                                    <CustomText text={'jpg,png,jpeg,bmp,gif,xlsx,xls,txt,doc,docx,md,pdf,ppt,pptx,wps;'} style={{fontSize:11, color:'red'}}></CustomText>                                  
                            </View>
                        </View>
                        :null
                    }
                    <OrderDetailInfoView onlyImage={true} order={baseInfo} otwThis={this} customerInfo={customerInfo} showImage={(url) => {
                        this.setState({
                            showImageUrl: url,
                            visible: true
                        })
                    }} />
                    {
                       fileList.map((item,index)=>{
                            return(
                                <View style={{ flexDirection: 'row',flex:1, height: 44, alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 20,justifyContent:'space-between',marginHorizontal:10,borderRadius:4}}>
                                    <CustomText text={item.FileName} style={{flex:3}}></CustomText>                 
                                    <AntDesign name={'delete'} onPress={()=>{
                                        fileList.splice(index,1);
                                        this.setState({})
                                    }} size={22} color={Theme.theme} />
                                </View>  
                            )
                        })
                    }
            </View>
        )
    }

    /**
     * 选择文件方法
     */
        _selectFile=()=>{
        const {fileList,baseInfo,customerInfo} = this.state;
        if(fileList.length>4){
            this.toastMsg('最多只能上传5个文件')
            return;
        }
        
        RNFileSelect.showFileList((res) => {
            let pos = res.path.lastIndexOf('/')
            let fileName = res.path.substr(pos+1)
            let pname = fileName.substring(0, fileName.lastIndexOf("."))
            let phouzhui = res.path.substring(res.path.lastIndexOf(".")+1)
            if(!res){return}
            if (res.type === 'cancel') {
              //用户取消
            } else if (res.type === 'path') {
              let data = RNFetchBlob.wrap(res.path)
              let model = [];
              model.unshift({ name: pname , data: data, filename: fileName, type:phouzhui});
            //   选中单个文件
              CommonService.OrderFileUpload(model).then(response => {
                  if (response && response.success) {
                     fileList.push(response.data[0]);
                    this.setState({
                        fileList:fileList
                    },()=>{
                        if(customerInfo.Setting.IsPdfAnalyze){
                            let model={
                                PdfUrl:response.data[0].Url,
                                orderCategory:CommonEnum.CategogryId.comp,
                                ReferencePassengerId:baseInfo.ReferencePassengerId,
                            }
                            CommonService.AnalyzePdfDictionary(model).then(response => {
                                if (response && response.success && response.data) {
                                    this.setState({
                                        PdfDictList:response.data,
                                    })
                                }
                            }).catch(error => {
                    
                            })
                        }
                    })
                  } else {
                    //   this.toastMsg(response.message || '获取数据失败');
                    this.toastMsg('上传失败');
                  }
              }).catch(error => {
                //   this.toastMsg(error.message || '获取数据异常');
                this.toastMsg('上传失败');
              })
            } else if (res.type === 'paths') {
              // 选中多个文件 看管理器支持情况目前采用默认的，只有会调用path
            } else if (res.type === 'error') {
              // 选择文件失败 
              this.toastMsg('上传失败');
            }
          })    
    }

    _selectImage=()=>{
        const {fileList} = this.state;
        if(fileList&&fileList.length>4){
            this.toastMsg('最多只能上传5个文件')
            return;
        }
        OpenGetPic.getFile(this).then(response => {
            response.data[0].FileName =  response.data[0].Name
            fileList.push(response.data[0]);
            this.setState({
                fileList:fileList,
                ImageInfo: response.imageInfo
            })
        })
    }
}

const getProps = (state) => ({
    apply: state.apply.apply,
    feeType: state.feeType.feeType,
    compMassOrderId: state.compMassOrderId.massOrderId,
    compCreate_bool: state.compCreate_bool.bool,
    comp_travelers:state.comp_travelers,
    comp_userInfo:state.comp_userInfo,
    customerInfo_userInfo:state.customerInfo_userInfo,
});
const getActions = dispatch => ({
    setApply: (value) => dispatch(Action.applySet(value)),
    setComp_travellers: (compEmployees,compTraveler,travellers) => dispatch(Action.setComp_travellers(compEmployees,compTraveler,travellers)),
    setComp_Id: (value) => dispatch(Action.setComp_Id(value)),
    onClickSure:(compCreateBool)=>dispatch(Action.onClickSure(compCreateBool)),
    onLoadcomprehensiveData:(userInfo,employees,travellers,ProjectId,ReferenceEmployeeId,IdModel,referencPassengerId)=>dispatch(Action.onLoadcomprehensiveData(userInfo,employees,travellers,ProjectId,ReferenceEmployeeId,IdModel,referencPassengerId)),

})
export default connect (getProps, getActions)(CompDetailScreen);
const styles = StyleSheet.create({
    conectText:{
        width:'80%',
    },
    row: {
        height: 44,
        backgroundColor: 'white',
        // paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:'space-between',
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        marginHorizontal:20,

    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 7,
    },
    btnStyle: {
        height:44,width:160,
        backgroundColor:Theme.theme,
        borderRadius:4,
        alignItems:'center',
        justifyContent:'center'
    },
    btnStyle2:{
        height:44,width:160,
        borderColor:Theme.theme,borderWidth:1,
        borderRadius:4,
        alignItems:'center',
        justifyContent:'center'
    },
    _btnStyle: {
        height:44,width:160,
        backgroundColor:Theme.theme,
        borderRadius:4,
        alignItems:'center',
        justifyContent:'center',
        marginBottom:10
    },
    _btnStyleNext: {
        height:44,
        width: '90%',
        backgroundColor:Theme.theme,
        borderRadius:4,
        alignItems:'center',
        justifyContent:'center',
        marginBottom:10,
        marginHorizontal: 10, // 左右边距
    },
    _btnStyle2:{
        height:44,width:160,
        borderColor:Theme.theme,borderWidth:1,
        borderRadius:4,
        alignItems:'center',
        justifyContent:'center',
        marginBottom:10
    },
    textStyle:{color:Theme.darkColor, fontSize:11,marginTop:2},
    textStyle2:{color:Theme.darkColor, fontSize:11},
    borderAll: {
        // width: 60,
        height: 25,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: "center",
        borderRadius: 3,
        paddingHorizontal:3
    },
    itemStyle:{
        backgroundColor:'#fff',
        marginHorizontal:10,
        borderRadius:6,
        marginTop:10
    },
    borderStyle:{
        marginHorizontal:15,
        backgroundColor:Theme.greenBg,
        borderRadius:4,
        padding:15,
        marginBottom:15
    },
    popStyle:{
        width:'100%',
        height: '100%',
        // backgroundColor: Theme.touMingColor,
        flexDirection:'column-reverse',
        // position: 'absolute',
        // bottom: 200,
        // left: 0,
        // right: 0
    },
    container2:{
        flex:1,
        backgroundColor:'rgba(0, 0, 0, 0.3)',
        justifyContent:'center',
        alignItems:'center',
      },
})
