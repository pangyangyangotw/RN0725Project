import SuperView from "../../super/SuperView";
import React from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    ImageBackground,
    TouchableHighlight,
    Text,
    Image,
    DeviceEventEmitter,
    ScrollView,
} from 'react-native';
import CustomText from '../../custom/CustomText';
import ViewUtil from "../../util/ViewUtil";
import CommonService from '../../service/CommonService';
import UserInfoDao from '../../service/UserInfoDao';
import CommonEnum from "../../enum/CommonEnum";
import AntDesign from 'react-native-vector-icons/AntDesign';
import Theme from "../../res/styles/Theme";
import StorageUtil from "../../util/StorageUtil";
import Key from "../../res/styles/Key";
import I18nUtil from "../../util/I18nUtil";
import { connect } from 'react-redux';
import Util from "../../util/Util";
import FlightService from "../../service/FlightService";
import AdCodeEnum from "../../enum/AdCodeEnum";
import AdContentInfoView from "../common/AdContentInfoView";
import Pop from 'rn-global-modal'
import  LinearGradient from 'react-native-linear-gradient';
import ChoosePersonView from '../ComprehensiveOrder/commen/ChoosePersonView';
import CustomActioSheet from '../../custom/CustomActionSheet';
import action from '../../redux/action';
class SearchScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            // title: '国内机票',
            titleView: this._headerTitleView(),
            // rightButton: props.feeType === 1 ? ViewUtil.getRightButton('差旅标准', this._getTravelRule) : null
        }
        const commenArr = 
              this.params.cityList?.map(item => ({  
                    Code:item.IataCode&&item.IataCode,  
                    Name:item.Name,
                    EnName:item.EnName,
                    Province:item.ProvinceName,
                    Letters:item.Letters,
                    Hot:item.Hot
               }))
        let newDay = new Date().addDays(1);
        let beginT = Util.Date.toDate(this.params.BeginTime);
        let isSingle = true;//是不是单程
        let goandback= false
        const { apply } = this.props;
        const { selectApplyItem,customerInfo } = this.params;
        let _selectApplyItem;
        if (apply) {//出差单判断往返
            if (apply.Destination && apply.Destination.DepartureList && apply.Destination.DepartureList.length > 0) {
                if (apply.Destination.JourneyType === 2) {
                    isSingle = false;
                    goandback = true;
                }
            } else if (apply.TravelApplyMode === 1 && apply.JourneyList && apply.JourneyList.length > 0) {
                const journeyType = selectApplyItem ? selectApplyItem.JourneyType : apply.JourneyList?.[0]?.JourneyType;
                if (journeyType) {
                    isSingle = journeyType !== 2;
                    goandback = journeyType === 2;
                }
                // 继续预订有apply.JourneyList但没有selectApplyItem
                if(!selectApplyItem){
                    apply.JourneyList.forEach((item,index)=>{
                         if(item?.BusinessCategory & 1){
                            _selectApplyItem = item
                            apply.selectApplyItem = _selectApplyItem
                         }
                    })
                }
            }
        }
        // let _canbin =
        //     customerInfo?.Setting?.FlightTravelApplyConfig?.IsEnableCanbinLimit ?
        //         apply&&apply.selectApplyItem&&apply.selectApplyItem.ExtensionJson&&apply.selectApplyItem.ExtensionJson.AirExtensionJson&&apply.selectApplyItem.ExtensionJson.AirExtensionJson.CanbinLimit
        //     :null
        this.state = {
            isSingle: isSingle,
            arrivalCityDisplay:this.params.arrivalCityDisplay?this.params.arrivalCityDisplay:commenArr&&commenArr[1]||'',
            goCityDisplay:this.params.goCityDisplay?this.params.goCityDisplay:commenArr&&commenArr[0]||'',
            goDate:this.params.BeginTime && beginT>newDay ? beginT : newDay,//去程时间 或多程的出发时间
            arrivalDate: this.params.EndTime && beginT>newDay?Util.Date.toDate(this.params.EndTime):new Date().addDays(2),//返程时间 或多程的第二个程出发时间
            historRecordList: [],
            adList: [],
            personList:[],
            applyNum:apply?.SerialNumber,
            applyTavelList:[],
            customerInfo:{},
            selectApplyItem:selectApplyItem||_selectApplyItem,
            moreTravel:false,
            selTravel:true,
            goandback:goandback,
            goCityDisplay2:'',
            arrivalCityDisplay2:'',
            // selectCabin:'经济舱',
            selectCabin:'不限',
            canbinOption:['不限','经济舱', '超值经济舱', '商务舱/公务舱', '头等舱'],
        }
    }

    // 重置手势滑动
    // static navigationOptions = ({ navigation }) => {
    //     return {
    //         gesturesEnabled: false
    //     }
    // }
    /**
     *  返回按钮
     */
    _backBtnClick = () => {
        this.pop();
    }
    
    /**
     *  标题
     */
     _headerTitleView = () => {
        return (
            <View style={{ width:200 ,alignItems:'center' }}>
                <CustomText text={'国内机票'} style={styles.titleText} />
            </View>
        )
    }
    componentWillUnmount() {
        DeviceEventEmitter.removeAllListeners('refreshaaa');
    }

    componentDidMount() {
        const { apply } = this.props;
        let _canbin = apply&&apply.selectApplyItem&&apply.selectApplyItem.ExtensionJson&&apply.selectApplyItem.ExtensionJson.AirExtensionJson&&apply.selectApplyItem.ExtensionJson.AirExtensionJson.CanbinLimit
        this.backFromShopListener = DeviceEventEmitter.addListener(
            'refreshaaa',  //监听器名
            () => {
                this.setState({
                    applyNum:null
                })
            },
        );
        UserInfoDao.getCustomerInfo().then(customerInfo => {
            this.setState({
                customerInfo:customerInfo
            },()=>{
                customerInfo?.Setting?.FlightTravelApplyConfig?.IsEnableCanbinLimit?
                this._selectCabinList(_canbin)
                :null
                if(customerInfo?.Setting?.FlightTravelApplyConfig?.IsEnableCanbinLimit){
                    this.setState({
                        selectCabin:_canbin?'经济舱':this.state.selectCabin
                    })
                }   
            })
        }).catch(error => {
            this.toastMsg(error.message);
        })
        if (apply) {
            if (!apply.selectJourney) return;
            if (apply.selectJourney?.JourneyType === 2) {
                this.state.isSingle = false;
            }
            this.setState({
                goDate: Util.Date.toDate(apply.selectJourney.DepartureTime),
                arrivalDate: Util.Date.toDate(apply.selectJourney.ReturnTime),
            }, () => {
                this._readCityData();
            })
            return;
        }
        StorageUtil.loadKeyId(Key.FlightSearchedCitys).then(response => {
            if (response && Array.isArray(response) && response.length > 0) {
                let obj = response[response.length - 1];
                this.setState({
                    goCityDisplay: obj.goCityData,
                    arrivalCityDisplay: obj.arrivalCityData,
                    historRecordList: response
                })
            }
        }).catch(error => {
            // this.toastMsg(error.message || '获取数据异常');
        })
        CommonService.GetAdStrategyContent(AdCodeEnum.flight).then(response => {
            if (response && response.success) {
                this.setState({
                    adList: response.data
                })
            }
        }).catch(error => {
            this.toastMsg(error.message || '获取数据异常');
        })
    }
    /**
     *  获取差旅标准
     */
    _getTravelRule = () => {
        const {ReferenceEmployee} = this.params;
        let modelStandar={
            OrderCategory:CommonEnum.orderIdentification.flight,
        }
        this.showLoadingView();
        CommonService.GetTravelStandards(modelStandar).then(response => {
            this.hideLoadingView();
            if (response?.data?.RuleDesc?.length > 0) {
                Pop.show(
                    <View style={styles.alertStyle}>
                       <View style={{alignItems:'center',justifyContent:'center'}}>
                           <CustomText text={'温馨提示'} style={{margin:6,fontSize:18, fontWeight:'bold'}} />
                       </View>
                       <View style={{width:'80%'}}>
                           <CustomText text={response.data.OrderCategoryDesc} style={{padding:2,fontSize:14,fontWeight:'bold'}}/>
                           {  
                               ReferenceEmployee && JSON.stringify(ReferenceEmployee)!='{}' && ReferenceEmployee.RulesTravelDetails? 
                                (ReferenceEmployee.RulesTravelDetails&&ReferenceEmployee.RulesTravelDetails.map((obj)=>{
                                    if(obj.Category===1){
                                    return( 
                                        obj.Rules.map((item, index)=>{
                                            return(
                                            <View style={{flexDirection:'row',padding:2}} key={index}>
                                                <CustomText text={item.Key+': '+item.Value}/>
                                            </View>
                                            )
                                        })
                                    )  
                                    }
                                }))
                                   :
                               (response.data.RuleDesc.map((item, index)=>{
                                return(
                                  <View style={{flexDirection:'row',padding:2}} key={index}>
                                     <CustomText text={item.Name+': '+item.Desc}/>
                                  </View>
                                )
                            }))    
                           }
                       </View>
                       <TouchableHighlight underlayColor='transparent' 
                                 style={{height:40,alignItems:'center',justifyContent:'center',marginTop:10,borderTopWidth:1,borderColor:Theme.lineColor}}
                                 onPress={()=>{Pop.hide()}}>
                                 <CustomText  text='确定' style={{fontSize:19,color:Theme.theme}}/>
                        </TouchableHighlight>
                    </View>
                    ,{animationType: 'fade', maskClosable: false, onMaskClose: ()=>{}})
             
            } else {
                this.showAlertView('国内机票:不限');
            } 
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }
    /**
     *  左右边点击啊
     * index是 1左 2右
     */
    _imagePress = (index) => {
        const {applyNum,customerInfo} = this.state;
        if(applyNum && customerInfo && customerInfo.Setting.FlightTravelApplyConfig.IsJourneyType){return};
        if (index === 0) {
            this.setState({
                isSingle: true,
                selTravel:true,
                moreTravel:false,
            })
        } else if(index === 1) {
            this.setState({
                isSingle: false,
                goandback:true,
                moreTravel:false,
            })
        }else if(index === 2){
            this.setState({
                moreTravel:true,
                goandback:false,
                selTravel:false,
                isSingle:false
            })
        }
    }
    /**
     * 出发或者返回城市的点击事件根据num=1是出发num=2是到达
     */
    _gotoSelectCity = (num) => {
        this.push('FlightCityIndex', {
            setBackCity: (data) => {
                if (num == 1) {//第一程出发站
                    this.setState({ goCityDisplay: data })
                } else if (num == 2){//第一程到达站
                    this.setState({ arrivalCityDisplay: data });
                }
                else if(num == 3){//第二程出发站
                    this.setState({ goCityDisplay2: data })
                }else if(num == 4){//第二程到达站
                    this.setState({ arrivalCityDisplay2: data });
                }
            }
        })
    }
    /**
     * 交互城市数据
     */
    _exchangeCity = (index) => {
        let [goCity, arrivalCity] = [this.state.arrivalCityDisplay, this.state.goCityDisplay];
        let [goCity2, arrivalCity2] = [this.state.arrivalCityDisplay2, this.state.goCityDisplay2];
        if(index==2){
            this.setState({
                goCityDisplay2: goCity2,
                arrivalCityDisplay2: arrivalCity2
            }) 
        }else{
            this.setState({
                goCityDisplay: goCity,
                arrivalCityDisplay: arrivalCity
            })
        }
    }
    /**
    *  选择日期
    */
    _gotoSelctDate = (num) => {
        this.push('Calendar', {
            num: num, 
            date: this.state.goDate,
            backDate: (date) => {
                if (num == 1) {
                    this.setState({
                        goDate: date,
                        arrivalDate:new Date(date) > new Date(this.state.arrivalDate)? date.addDays(1):this.state.arrivalDate
                    })
                }else if(num == 3){
                    if(new Date(date) < new Date(this.state.goDate)){
                        this.toastMsg('返程时间不能小于出发时间');
                        return;
                    }else{
                        this.setState({
                            arrivalDate: date
                        })
                    }
                } else {
                    this.setState({
                        arrivalDate: date
                    })
                }
            }
        })
    }
    /**
     *  点击历史给城市赋值
     */
    _historySearchCityTouch = (item) => {
        this.setState({
            goCityDisplay: item.goCityData,
            arrivalCityDisplay: item.arrivalCityData
        })
    }
    /**
     *  清除历史记录
     */
    _clearHistory = () => {
        this.setState({
            historRecordList: []
        }, () => {
            StorageUtil.removeKeyId(Key.FlightSearchedCitys);
        })
    }

    /**
     * 去查询列表
     */
    _goSerchList = () => {
        const { goCityDisplay, arrivalCityDisplay, historRecordList,moreTravel,goCityDisplay2,arrivalCityDisplay2,isSingle } = this.state;

        if (goCityDisplay == '' || arrivalCityDisplay == '') {
            this.toastMsg('出发城市或到达城市不能为空');
            return;
        }
        if (moreTravel && (goCityDisplay2 == '' || arrivalCityDisplay2 == '')) {
            this.toastMsg('第二程出发城市或到达城市不能为空');
            return;
        }
        if (goCityDisplay.Name === arrivalCityDisplay.Name) {
            this.toastMsg('出发城市和到达城市不能一样');
            return;
        }
        if (historRecordList && Array.isArray(historRecordList)) {
            let index = historRecordList.findIndex(item => {
                return item.goCityData.display === goCityDisplay.Name && item.arrivalCityData.Name === arrivalCityDisplay.Name;
            })
            if (index > -1) {
                [historRecordList[index], historRecordList[historRecordList.length - 1]] = [historRecordList[historRecordList.length - 1], historRecordList[index]];
            } else {
                historRecordList.push({
                    goCityData: goCityDisplay,
                    arrivalCityData: arrivalCityDisplay
                })
                if (historRecordList.length > 6) {
                    historRecordList.splice(0, 1);
                }
            }
            StorageUtil.saveKeyId(Key.FlightSearchedCitys, historRecordList);
        }
        this.props.setHightRiskData();
        this.props.setHightRiskData2();
        if(!isSingle && !moreTravel){
            this._highRisk(goCityDisplay, arrivalCityDisplay,arrivalCityDisplay, goCityDisplay);
        }else{
            this._highRisk(goCityDisplay, arrivalCityDisplay,goCityDisplay2, arrivalCityDisplay2);
        }
        this.setState({});
    }

    _highRisk(goCityDisplay, arrivalCityDisplay, goCityDisplay2, arrivalCityDisplay2){
        const { moreTravel,isSingle } = this.state;
        CommonService.HighRiskPC2({
            DepartureCode:goCityDisplay.Code,
            ArrivalCode:arrivalCityDisplay.Code,
            BusinessCategory:1},this)
        .then(res=>{
            if( res && res.success && res.data ){
                let highRisk = res.data.find(obj=>obj.Type == 2);
                this.props.setHightRiskData(highRisk);
                if(moreTravel || !isSingle){
                    this._highRisk2(goCityDisplay2, arrivalCityDisplay2, res.data);
                }else{
                    if(highRisk){
                        if(highRisk.Level == 3 || highRisk.Level == 2){
                            this.showAlertView(highRisk.Message, () => {
                                return ViewUtil.getAlertButton('确定', () => {
                                    this.dismissAlertView();
                                    if(highRisk.Level == 3){
                                        //3级高危不可查 不可订
                                    }else{
                                        this.OrderTravelApply()
                                    }
                                })
                            })
                        }else{
                            this.OrderTravelApply()
                        }
                    }
                }
            }else{
                this.OrderTravelApply()
            }
        })
        .catch(error=>{
            this.OrderTravelApply()
        });
    }

    _highRisk2(goCityDisplay2, arrivalCityDisplay2,resData1){
        const { moreTravel } = this.state;
        CommonService.HighRiskPC2({
            DepartureCode:goCityDisplay2.Code,
            ArrivalCode:arrivalCityDisplay2.Code,
            BusinessCategory:1},this)
        .then(res=>{
            if(res){
                let highRisk = resData1.find(obj=>obj.Type == 2);
                let highRisk2 = res.data.find(obj=>obj.Type == 2);
                let hightRiskData ;
                if( highRisk && highRisk2 && highRisk.Level >0 && highRisk.Level > 0){
                    if(highRisk2.Level >= highRisk.Level){
                        hightRiskData = highRisk2;
                    }else{
                        hightRiskData = highRisk;
                    }
                }else if( highRisk2 && highRisk2.Level > 0){
                    hightRiskData = highRisk2
                }
                this.props.setHightRiskData2(highRisk2);
                if(hightRiskData.Level == 3 || hightRiskData.Level == 2){
                    this.showAlertView(hightRiskData.Message, () => {
                        return ViewUtil.getAlertButton('确定', () => {
                            this.dismissAlertView();
                            if(hightRiskData.Level == 3){
                                //3级高危不可查 不可订
                            }else{
                                this.OrderTravelApply()
                            }
                        })
                    })
                }else{
                    this.OrderTravelApply()
                }
            }else{
                this.OrderTravelApply()
            }
        })
        .catch(error=>{
            this.OrderTravelApply()
        });
    }

    OrderTravelApply(){
        const { goCityDisplay, arrivalCityDisplay, isSingle, goDate, arrivalDate,selectApplyItem,goCityDisplay2,arrivalCityDisplay2,moreTravel,selectCabin,customerInfo } = this.state;
        const { apply,compSwitch,comp_userInfo, comp_travelers,compCreate_bool } = this.props;
        //comp_userInfo 是创建综合订单时储存的出差人信息
        //comp_travelers 是综合订单列表 继续预订 ，已经选好的出差人
        let chooseLists;
        // if(compSwitch){
            if(compCreate_bool){//判断该综合订单是创建还是继续预订
                // if(!comp_userInfo&&!comp_userInfo.userInfo&&!comp_userInfo.employees&&!comp_userInfo.travellers&&!comp_userInfo.ProjectId){
                //     return;
                // }
                chooseLists = comp_userInfo&&comp_userInfo.employees
            }else{
                chooseLists=comp_travelers&&comp_travelers.compEmployees
            }
        // }
        let params = {
            isSingle: isSingle,
            goCityData: goCityDisplay,
            arrivalCityData: arrivalCityDisplay,
            goDate: goDate,
            arrivalDate: arrivalDate,
            goCityData2: goCityDisplay2,
            arrivalCityData2: arrivalCityDisplay2,
            fromCategory: 1,//订单类型 1.国内机票，7国际机票，4国内酒店，6国际酒店，5火车票
            moreTravel:moreTravel,//是不是多程
            selectCabin:selectCabin,
            canbinOption:this.state.canbinOption,
            customerInfo: customerInfo,
        }
        let journeyType = 1;
        let journeyid = 0;
        if(apply){
            if(apply.TravelApplyMode==1 && apply.JourneyList && apply.JourneyList.length>0){
                //行程模式
                journeyType = selectApplyItem&&selectApplyItem.JourneyType;
                journeyid = selectApplyItem&&selectApplyItem.Id
            }else{
                //目的地模式
                journeyType = apply?.JourneyType;
                journeyid = apply?.Id
            }
            let model ={
                ApplyId:apply.Id, //申请单对象
                JourneyId:journeyid,//申请单行程Id
                Category: 1,//订单类型 1.国内机票，8国际机票，4国内酒店，16国际酒店，2火车票
                Departure: goCityDisplay.Name,//出发城市（查询出发城市）
                Destination: arrivalCityDisplay.Name,//到达城市（查询到达城市）
                BeginTime:goDate.format('yyyy-MM-dd HH:mm'), //出发时间(填查询时间)
                // JourneyType:journeyType,//行程类型  单程或往返 1.单程，2.往返
                JourneyType:isSingle ? 1 : moreTravel ? 3 : 2, //行程类型  单程或往返 1.单程，2.往返
                EndTime:arrivalDate.format('yyyy-MM-dd HH:mm'), //到达时间(填查询时间)
                Travellers:chooseLists, //综合订单自己选的人
                ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            };
            if(this.params.IsJourneyType){
                if(journeyType==1 && !isSingle){
                this.setState({isSingle:true})
                }else if(journeyType==2 && isSingle){
                this.setState({isSingle:false})
                }
            }
            params.JourneyId = journeyid
            CommonService.OrderValidateTravelApply(model).then(response => {
                if (response && response.success) {
                    // compSwitch?this.push('FlightScreenIndex', params): this.push('TravelBookScreen',params)
                    this.push('FlightScreenIndex', params)
                } else {
                    this.toastMsg(response.message || '操作失败');
                }
            }).catch(error => {
                this.toastMsg(error.message || '操作失败');
            })
        }else{
            // compSwitch?this.push('FlightScreenIndex', params): this.push('TravelBookScreen',params)
            this.push('FlightScreenIndex', params)
        }       
    }
    /**
     *  左右行程按钮
     */
    _renderHeader1 = () => {
        const { isSingle,applyNum,customerInfo } = this.state;
        return (
            <View style={{ flexDirection: 'row', height: 50,padding:5 }}>
                <TouchableHighlight underlayColor='transparent' style={{ flex: 1 }} onPress={this._imagePress.bind(this, 1)}>
                    {
                        isSingle ?
                            <ImageBackground resizeMode='stretch' style={styles.image} source={require('../../res/image/b_g_r.png')}>
                                <CustomText text='单程' style={{color:Theme.theme, fontSize:16,fontWeight:'bold'}} />
                            </ImageBackground> :
                            <View style={styles.image}>
                                <CustomText text='单程' style={{color:Theme.darkColor, fontSize:14}} />
                            </View>
                    }
                </TouchableHighlight>
                <TouchableHighlight style={{ flex: 1 }} underlayColor='transparent' onPress={this._imagePress.bind(this, 2)}>
                    {
                        isSingle ?
                            <View style={styles.image}>
                                <CustomText text='往返' style={{color:Theme.darkColor, fontSize:14,fontWeight:'bold'}}/>
                            </View> :
                            <ImageBackground resizeMode='stretch' style={styles.image} source={require('../../res/image/b_g_l.png')}>
                                <CustomText text='往返' style={{color:Theme.theme, fontSize:16,fontWeight:'bold'}}/>
                            </ImageBackground>
                    }
                </TouchableHighlight>
            </View>
        )
    }
    _renderHeader = () => {
        const { isSingle,applyNum,customerInfo,moreTravel,selTravel,goandback } = this.state;
        // let travButs = ['单程','往返','多程'];
        let travButs = [
            {_title:'单程',_choose:(isSingle && selTravel) ?true:false},
            {_title:'往返',_choose:(!isSingle && goandback) ?true:false},
            {_title:'多程',_choose:moreTravel}
        ];
        return (
            <View style={{ flexDirection: 'row', height: 44, marginHorizontal:20, backgroundColor:Theme.normalBg, borderRadius:6 }}>
               {
                 travButs.map((item,index)=>{
                    return(
                        <TouchableOpacity onPress={this._imagePress.bind(this, index)}
                                          style={{margin:4, backgroundColor:item._choose?'#fff':Theme.normalBg,justifyContent:'center',flex:1,borderRadius:3,alignItems:'center'}}>
                            <CustomText text={item._title} style={{fontSize:14}}></CustomText>
                        </TouchableOpacity>
                    )
                 })
               }
            </View>
        )
    }

    _renderCity = () => {//多程时添加判断
        const { goCityDisplay, arrivalCityDisplay } = this.state;
        return (
            <View style={{ flexDirection: 'row', height: 69, alignItems: 'center',paddingHorizontal:20,justifyContent:'space-between' }}>
                <TouchableHighlight underlayColor='transparent' style={{ }} onPress={this._gotoSelectCity.bind(this, 1)}>
                    <CustomText style={[styles.text, { color: goCityDisplay ? 'black' : Theme.promptFontColor, }]} text={goCityDisplay ? goCityDisplay.Name : '出发城市'} />
                </TouchableHighlight>
                <TouchableOpacity underlayColor='transparent' onPress={()=>this._exchangeCity()}>
                    <Image style={{height:28,width:28}} source={require('../../res/Uimage/flightFloder/flightSwich.png')}  ></Image>
                </TouchableOpacity>
                <TouchableHighlight underlayColor='transparent' style={{  }} onPress={this._gotoSelectCity.bind(this, 2)}>
                    <CustomText style={[styles.text, { color: arrivalCityDisplay ? 'black' : Theme.promptFontColor }]} text={arrivalCityDisplay ? arrivalCityDisplay.Name : '到达城市'} />
                </TouchableHighlight>
            </View>
        )
    }
    _renderCity2 = () => {//多程时添加判断
        const { goCityDisplay2, arrivalCityDisplay2 } = this.state;
        return (
            <View style={{ flexDirection: 'row', height: 69, alignItems: 'center',paddingHorizontal:20,justifyContent:'space-between' }}>
                <TouchableHighlight underlayColor='transparent' style={{ }} onPress={this._gotoSelectCity.bind(this, 3)}>
                    <CustomText style={[styles.text, { color: goCityDisplay2 ? 'black' : Theme.promptFontColor }]} text={goCityDisplay2 ? goCityDisplay2.Name : '出发城市'} />
                </TouchableHighlight>
                <TouchableOpacity underlayColor='transparent' onPress={()=>this._exchangeCity(2)}>
                    <Image style={{height:28,width:28}} source={require('../../res/Uimage/flightFloder/flightSwich.png')}  ></Image>
                </TouchableOpacity>
                <TouchableHighlight underlayColor='transparent' style={{  }} onPress={this._gotoSelectCity.bind(this, 4)}>
                    <CustomText style={[styles.text, { color: arrivalCityDisplay2 ? 'black' : Theme.promptFontColor }]} text={arrivalCityDisplay2 ? arrivalCityDisplay2.Name : '到达城市'} />
                </TouchableHighlight>
            </View>
        )
    }

    _renderCalendar2 = (index) => {
        const { arrivalDate, isSingle } = this.state;
        return (
                <View style={{flexDirection: 'row',justifyContent:'space-between' }}>
                    <TouchableOpacity style={{  flexDirection: 'row'}} onPress={this._gotoSelctDate.bind(this, 3)}>
                        <View style={styles.dateStyle}>
                            <CustomText style={{ color: arrivalDate ? 'black' : Theme.promptFontColor,fontSize:18 }} text={arrivalDate ? (arrivalDate.format('MM-dd')) : '出发时间'} />
                            {
                                arrivalDate&&Util.Parse.isChinese() ?
                                    <CustomText style={[{ color: Theme.commonFontColor ,fontSize:12}]} text={'  ' + I18nUtil.translate(Util.Date.getWeekDesc(arrivalDate))} /> :
                                null
                            }
                        </View> 
                    </TouchableOpacity>
                    <View style={{ height: 1, backgroundColor: Theme.themeLine, marginHorizontal:20 }}></View>
            </View>
        )
    }

    _renderCalendar = (index) => {
        const { goDate, arrivalDate, isSingle,moreTravel } = this.state;
        return (
                <View style={{flexDirection: 'row',justifyContent:'space-between' }}>
                    <TouchableOpacity style={{  flexDirection: 'row'}} onPress={this._gotoSelctDate.bind(this, 1)}>
                        <View style={styles.dateStyle}>
                            <CustomText style={{ color: goDate ? 'black' : Theme.promptFontColor,fontSize:18 }} text={goDate ? (goDate.format('MM-dd')) : '出发时间'} />
                            {
                                goDate&&Util.Parse.isChinese() ?
                                    <CustomText style={[{ color: Theme.commonFontColor ,fontSize:12}]} text={'  ' + I18nUtil.translate(Util.Date.getWeekDesc(goDate))} /> :
                                null
                            }
                        </View> 
                    </TouchableOpacity>
                    <View style={{ height: 1, backgroundColor: Theme.themeLine, marginHorizontal:20 }}></View>
                {(!isSingle && !moreTravel) ? 
                    <View>
                        <TouchableOpacity style={{  flexDirection: 'row' }} onPress={this._gotoSelctDate.bind(this, 2)}>
                            <View style={styles.dateStyle}>
                                <CustomText style={[{ color: arrivalDate ? 'black' : Theme.promptFontColor ,fontSize:18}]} text={arrivalDate ? (arrivalDate.format('MM-dd')) : '到达时间'} />
                                {
                                    arrivalDate&&Util.Parse.isChinese() ?
                                        <CustomText style={[{ color: Theme.commonFontColor,fontSize:12 }]} text={'  ' + I18nUtil.translate(Util.Date.getWeekDesc(arrivalDate))} /> :
                                    null
                                }
                            </View>
                        </TouchableOpacity>
                    </View> 
                 : null}
            </View>
        )
    }

    _historySearchCity = () => {
        const { historRecordList } = this.state;
        if (!historRecordList || historRecordList.length === 0) return; 
            let obj = {};
            let historyArr = historRecordList.filter(function (item, index, arr) {
                return obj.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj[typeof item + JSON.stringify(item)] = true);
            });
        return (
            <View style={{}}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginHorizontal:20}}>
                    <Text style={{fontSize:13 }}>{I18nUtil.translate('近期查询')}</Text>
                    <CustomText onPress={this._clearHistory} style={{ color: Theme.theme }} text='清除' />
                </View>
                <View style={ styles.historView}>
                    {
                        historyArr.map((item, index) => {
                            return (
                                <View style={{alignItems:'center', justifyContent:'center',margin:5, borderWidth:1,borderRadius:2,borderColor:Theme.promptFontColor}} >
                                  <CustomText key={index} style={styles.histortText} 
                                              onPress={this._historySearchCityTouch.bind(this, item)} text={I18nUtil.translate(item.goCityData.Name) + '-' + I18nUtil.translate(item.arrivalCityData.Name)} />
                                </View>
                            )
                        })
                    }
                </View>
            </View>
        )
    }
   
    renderBody() {
        const {comp_userInfo, comp_travelers,compCreate_bool,compSwitch} = this.props;
        const {customerInfo,moreTravel,canbinOption} = this.state;
        return (
            <ScrollView>
                <AdContentInfoView adList={this.state.adList}/>
                {/* {compSwitch? */}
                    <View style={{paddingHorizontal:10}}>
                       <ChoosePersonView comp_userInfo={comp_userInfo} comp_travelers={comp_travelers} compCreate_bool={compCreate_bool}/>
                    </View>
                 {/* :null} */}
                <View style={styles.contain}>
                    <View style={{flexDirection:'row',paddingHorizontal:20,paddingVertical:15}}>
                        <Image source={require('../../res/Uimage/flightFloder/BusinessTrip.png')} style={{width:20,height:20,marginRight:5}}/>
                        <CustomText text={'出差行程'} style={{fontSize:14}}></CustomText>
                    </View>
                    {this._renderHeader()}
                    {this._renderCity()}
                    <View style={{ height: 1, backgroundColor: Theme.themeLine, marginHorizontal:20 }}></View>
                    {this._renderCalendar()}
                    {
                        moreTravel?
                        <View>
                            {this._renderCity2()}
                            <View style={{ height: 1, backgroundColor: Theme.themeLine, marginHorizontal:20 }}></View>
                            {this._renderCalendar2()}
                            <View style={{ height: 1, backgroundColor: Theme.themeLine, marginHorizontal:20 }}></View>
                        </View>:
                        null
                    }
                    <View style={{ height: 1, backgroundColor: Theme.themeLine, marginHorizontal:20 }}></View>
                    {
                        this._chooseCabin()
                    }
                    <View style={{ height: 1, backgroundColor: Theme.themeLine, marginHorizontal:20}}></View>
                    { 
                    //   customerInfo.Setting&&customerInfo.Setting.FlightTravelApplyConfig&&customerInfo.Setting.FlightTravelApplyConfig.IsOnlyApply?
                    //   this._chooseApply()
                    //   :null
                        customerInfo&&customerInfo.Addition&&customerInfo.Addition.HasTravelApplyAuth?
                        this._chooseApply()
                        :null
                    }
                    <View style={{ height: 1, backgroundColor: Theme.themeLine, marginHorizontal:20,marginBottom:10 }}></View>
                    {
                      ViewUtil.getSubmitButton2('机票查询', this._goSerchList)
                    }
                    {
                      this._historySearchCity()
                    }
                    <CustomActioSheet ref={o => this.seatActionSheet = o} options={canbinOption} onPress={this._canbinPress} />
                </View>
                
                
            </ScrollView>
        )
    }
    _canbinPress=(index)=>{
        const { canbinOption } = this.state
        if(index != 'cancel'){
            this.setState({
                selectCabin: canbinOption[index]
            })
        }else{
            this.setState({
                selectCabin: null
            })
        }
    }

    _chooseCabin = () => {
        const {selectCabin} = this.state;
        return(
            <View style={{ flexDirection: 'row', height: 60, alignItems: 'center' }}>
                <TouchableOpacity style={{ flex: 1, paddingHorizontal:20, justifyContent:'space-between'}} 
                                  onPress={()=>{
                                    this.seatActionSheet.show();
                                  }}>
                        <View style={{ 
                                    alignItems: 'center', 
                                    flexDirection:'row',
                                    justifyContent:'space-between'
                                    }}>
                            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center'}}>
                            <CustomText text={selectCabin?selectCabin:'请选择舱位'} style={{color:!selectCabin?Theme.promptFontColor:Theme.fontColor,fontSize:16}} />
                            <TouchableOpacity style={{height:36,width:36,alignItems:'center',justifyContent:'center'}}
                                onPress={()=>{
                                    this.seatActionSheet.show();
                                }}
                            >
                                {/* {selectCabin&&<AntDesign name="close" size={18} style={{color:Theme.promptFontColor}}></AntDesign>} */}
                            </TouchableOpacity> 
                            </View>
                            {/* {<AntDesign name="close" size={18} style={{color:Theme.promptFontColor}}></AntDesign>} */}
                            <AntDesign name={'right'} size={16} color={Theme.promptFontColor} />
                        </View>     
                </TouchableOpacity>
            </View>
        )
    }

    _chooseApply = () => {
        const { applyNum } = this.state;
        const { compSwitch } = this.props;
        return(
            <View style={{ flexDirection: 'row', height: 60, alignItems: 'center' }}>
                <TouchableOpacity 
                                  style={{ flex: 1, paddingHorizontal:20, justifyContent:'space-between'}}
                                //   disabled={this.params.SerialNumber?true:false}
                                  disabled={compSwitch?(this.params.SerialNumber?false:true):true}  
                                  onPress={this._chooseApplybtn}>
                        <View style={{ 
                                    alignItems: 'center', 
                                    flexDirection:'row',
                                    justifyContent:'space-between'
                                    }}>
                            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center'}}>
                                <CustomText text={applyNum?applyNum:'请选择申请单'} style={{color:(!applyNum||this.params.bCategory)?Theme.promptFontColor:Theme.fontColor,fontSize:applyNum?18:16}} />
                                { 
                                    this.params.SerialNumber?null:
                                    <TouchableOpacity style={{height:36,width:36,alignItems:'center',justifyContent:'center'}}
                                        onPress={()=>{
                                                this.props.setApply();
                                                this.setState({
                                                    applyNum:null
                                                })
                                        }}
                                    >
                                        {applyNum&&<AntDesign name="close" size={18} style={{color:Theme.promptFontColor}}></AntDesign>}
                                    </TouchableOpacity> 
                                }
                            </View>
                            <AntDesign name={'right'} size={16} color={Theme.promptFontColor} />
                        </View>     
                </TouchableOpacity>
            </View>
        )
    }

    _chooseApplybtn = () => {
        const { customerInfo } = this.state;
        this.push('ApplicationSelect',{
            from:'flight',
            SerialNumber:this.params.SerialNumber,
            callBack:(obj,arrivalCityDisplay,goCityDisplay,BeginTime,EndTime,selectApplyItem)=>{
                let newDay = new Date().addDays(1);
                let beginT = Util.Date.toDate(BeginTime)
                let goCity = {
                    Code:goCityDisplay.IataCode&&goCityDisplay.IataCode,  
                    Name:goCityDisplay.Name,
                    EnName:goCityDisplay.EnName,
                    Province:goCityDisplay.ProvinceName,
                    Letters:goCityDisplay.Letters,
                    Hot:goCityDisplay.Hot
                }
                let arrivalCity = {
                    Code:arrivalCityDisplay.IataCode&&arrivalCityDisplay.IataCode,  
                    Name:arrivalCityDisplay.Name,
                    EnName:arrivalCityDisplay.EnName,
                    Province:arrivalCityDisplay.ProvinceName,
                    Letters:arrivalCityDisplay.Letters,
                    Hot:arrivalCityDisplay.Hot
                }
                if(obj.Destination&&obj.Destination.DepartureList&&obj.Destination.DepartureList.length>0){//判断是不是目的地模式行程单
                    this.setState({
                        isSingle:obj.Destination.JourneyType==1?true:false,
                        arrivalCityDisplay:arrivalCity,
                        goCityDisplay:goCity,
                        goDate:BeginTime && beginT>newDay ? beginT : newDay,
                        arrivalDate:EndTime && beginT>newDay?Util.Date.toDate(EndTime):new Date().addDays(2),
                    })
                }else if(obj.JourneyList){
                    this.setState({
                        isSingle:selectApplyItem&&selectApplyItem.JourneyType==1 ? true : false,
                        arrivalCityDisplay: arrivalCity,
                        goCityDisplay:goCity,
                        goDate:BeginTime && beginT>newDay ? beginT : newDay,
                        arrivalDate:EndTime && beginT>newDay?Util.Date.toDate(EndTime):new Date().addDays(2),
                        selectApplyItem: selectApplyItem
                    })
                }
                let _canbin = selectApplyItem&&selectApplyItem.ExtensionJson&&apply.selectApplyItem.ExtensionJson.AirExtensionJson&&apply.selectApplyItem.ExtensionJson.AirExtensionJson.CanbinLimit
                if(customerInfo?.Setting?.FlightTravelApplyConfig?.IsEnableCanbinLimit){
                    this._selectCabinList(_canbin)
                }
                this.setState({
                    applyNum:obj.SerialNumber,
                    applyTavelList:obj.TravellerList,
                    selectCabin:_canbin?'经济舱':this.state.selectCabin,//默认经济舱
                })
            }}
        );
    }

    _selectCabinList = (canbinLimit) => {
        if(!canbinLimit){return;}
        //'超值经济舱', '商务舱/公务舱'
        switch(canbinLimit){
            case "F":
                this.setState({
                    canbinOption:['经济舱','超值经济舱','商务舱/公务舱','头等舱']
                })
                break;
            case "CJ":
                this.setState({
                    canbinOption:['经济舱','超值经济舱','商务舱/公务舱']
                })
                break;
            case "C":
                this.setState({
                    canbinOption:['经济舱','超值经济舱','商务舱/公务舱']
                })
                break;
            case "J":
                this.setState({
                    canbinOption:['经济舱','超值经济舱','商务舱/公务舱']
                })
                break;
            case "P":
                this.setState({
                    canbinOption:['经济舱','超值经济舱']
                })
                break;
            case "Y":
                this.setState({
                    canbinOption:['不限','经济舱','超值经济舱']
                })
                break;
        }
        return;        
    }

    _readCityData = () => {
        StorageUtil.loadKeyId(Key.FlightCitysData).then(response => {
            if (response) {
                this._analyData(response);
            } else {
                this._loadCity();
            }
        }).catch(error => {
            this._loadCity();
        })
    }
    _loadCity = () => {
        this.showLoadingView();
        FlightService.GetCityList2().then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data) {
                    StorageUtil.saveKeyId(Key.FlightCitysData, response.data);
                    this._analyData(response.data);
                }
            } else {
                this.toastMsg(response.message || '获取城市信息失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取城市信息失败');
        })
    }
    _analyData = (result) => {
        if (!result) return;
        let journey = this.props.apply.selectJourney;
        let goCity = null;
        let arrivalCity = null;
        if (result) {
            for (let index = 0; index < result.length; index++) {
                const obj = result[index];
                if (goCity && arrivalCity) {
                    break;
                }
                if (obj.Name === journey.Departure) {
                    goCity = obj;
                }
                if (obj.Name === journey.Destination) {
                    arrivalCity = obj;
                }
                if (goCity && arrivalCity) {
                    this.setState({
                        goCityDisplay: goCity,
                        arrivalCityDisplay: arrivalCity
                    })
                    break;
                }
            }
        }
    }
}

const getProps = (state) => ({
    apply: state.apply.apply,
    feeType: state.feeType.feeType,
    comp_userInfo: state.comp_userInfo,
    compSwitch: state.compSwitch.bool,
    comp_travelers: state.comp_travelers,
    compCreate_bool:state.compCreate_bool.bool
})

const getAction = dispatch => ({
    setHightRiskData: (value) => dispatch(action.highRiskSetData(value)),
    setHightRiskData2: (value) => dispatch(action.highRiskSetData2(value)),
    setApply: (value) => dispatch(action.applySet(value)),

})

export default connect(getProps,getAction)(SearchScreen);

const $height = 60;
const styles = StyleSheet.create({
    ad: {
        backgroundColor: "white",
        height: 40,
        marginHorizontal: 10,
        marginTop: 5,
        alignItems: 'center',
        flexDirection: "row",
        paddingHorizontal: 10
    },
    contain: {
        marginHorizontal: 10,
        paddingBottom:30,
        borderRadius:6,
        backgroundColor: '#fff',
        elevation:0.3, shadowColor:'#ccc', shadowOffset:{width:1,height:1}, shadowOpacity: 0.1, shadowRadius: 1.5
    },
    image: {
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',

    },
    image2: {
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        // elevation:1.5, shadowColor:'#999999', shadowOffset:{width:5,height:5}, shadowOpacity: 0.2, shadowRadius: 1.5
    },
    city: {
        flexDirection: 'row',
        flex: 1,

    },
    view: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    text: {
        height: $height,
        flex: 1,
        textAlign: 'center',
        lineHeight: $height,
        fontSize:20
    },
    circle: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.theme
    },
    histortText: {
        height: 26,
        color: Theme.darkColor,
        fontSize: 13,
        lineHeight: 26,
        textAlign: 'center',
        borderRadius:15,
        paddingHorizontal:3
    },
    alertStyle:{
        width: '80%', 
        backgroundColor:'#fff',
        borderRadius:8,
        padding:10,
    },
    historView:{ 
        flexDirection: 'row', 
        flexWrap: 'wrap',
        paddingTop:10,
        paddingHorizontal:15,
    },
    dateStyle:{ 
        justifyContent: 'center', 
        alignItems: 'center', 
        height:66,
        backgroundColor:'#fff',
        flexDirection:'row',
        marginHorizontal:20,
    },
    titleText: {
        fontSize: 18,
        color: Theme.darkColor
    },

})