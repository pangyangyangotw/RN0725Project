import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    TouchableHighlight,
    Image,
    ScrollView
} from 'react-native';
import SuperView from '../../super/SuperView';
import I18nUtil from '../../util/I18nUtil';
import CustomText from '../../custom/CustomText';
import { FlatList } from 'react-native-gesture-handler';
import Theme from '../../res/styles/Theme';
import { connect } from 'react-redux';
import TrainService from '../../service/TrainService';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LisItemView from './ListItemView';
import Util from '../../util/Util';
import NetworkFaildView from '../../custom/NetWorkFaildView';
import UserInfoDao from '../../service/UserInfoDao';
import CommonEnum from '../../enum/CommonEnum';
import ViewUtil from '../../util/ViewUtil';
import Pop from 'rn-global-modal';
import CommonService from '../../service/CommonService';
import StorageUtil from '../../util/StorageUtil';
import Key from '../../res/styles/Key';
// import { ScrollView } from 'react-navigation';
import TrainlistView from './TrainlistView';
const dcCodes = ['D', 'G', 'GD', 'C', 'XGZ'];
class TrainListScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        let isReissue = this.params.reissueOrder ? I18nUtil.translate('（改签）') : '';
        let queryModel = this.params.queryModel || {};
        this._navigationHeaderView = {
            title: `${I18nUtil.translate(queryModel.fromCityName)} - ${I18nUtil.translate(queryModel.toCityName)}${isReissue}`,
            rightButton: props.feeType === 1 ? ViewUtil.getRightImageButton(this._getTravelRule) : null
        }
        this._tabBarBottomView = {
            bottomInset: true,
            bottomColor: 'white'
        }
        this.state = {
            bottomIndex: 0,
            dataList: [],
            recordList: [],
            isFilter: false,
            filterOptions: {
                FromStations: '不限',
                ToStations: '不限',
                FromStations2: [],
                ToStations2: [],
                TrainNewType:'不限',
                TrainGroup:'不限',
                FromTime:'不限',
                ToTime:'不限',
                TrainTicketType:'不限',
            },
            showErrorMessage: '',
            customerInfo:'',
            cityList:[],
            from_stationList:[],
            to_stationList:[],
        }
    }

    /**
      *  获取差旅标准
      */
    _getTravelRule = () => {
        this.showLoadingView();
        const { ReferenceEmployee } = this.props;
        let modelStandar={
            OrderCategory:CommonEnum.orderIdentification.train,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            RulesTravelId:ReferenceEmployee?.RulesTravelId,
        }
        CommonService.GetTravelStandards(modelStandar).then(response => {
            this.hideLoadingView();
            if (response?.data?.RuleDesc?.length > 0) {
                Pop.show(
                    <View style={styles.alertStyle}>
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <CustomText text={'温馨提示'} style={{ margin: 6, fontSize: 18, fontWeight: 'bold' }} />
                        </View>
                        <View style={{ width: '80%' }}>
                            <CustomText text={response.data.OrderCategoryDesc} style={{ padding: 2, fontSize: 14, fontWeight: 'bold' }} />
                            {
                                // ReferenceEmployee && JSON.stringify(ReferenceEmployee) != '{}' && ReferenceEmployee.RulesTravelDetails ?
                                //     ReferenceEmployee.RulesTravelDetails && ReferenceEmployee.RulesTravelDetails.map((obj) => {
                                //         if (obj.Category === 5) {
                                //             return (
                                //                 obj.Rules.map((item, index) => {
                                //                     return (
                                //                         <View style={{ flexDirection: 'row', padding: 2 }} key={index}>
                                //                             <CustomText text={item.Key + ': ' + item.Value} />
                                //                         </View>
                                //                     )
                                //                 })
                                //             )
                                //         }
                                //     })
                                //     :
                                    response.data.RuleDesc.map((item) => {
                                        return (
                                            <View style={{ flexDirection: 'row', padding: 2 }}>
                                                <CustomText text={item.Name + ': ' + item.Desc} />
                                            </View>
                                        )
                                    })
                            }
                        </View>
                        <TouchableHighlight underlayColor='transparent'
                            style={{ height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderTopWidth: 1, borderColor: Theme.lineColor }}
                            onPress={() => { Pop.hide() }}>
                            <CustomText text='确定' style={{ fontSize: 19, color: Theme.theme }} />
                        </TouchableHighlight>
                    </View>
                    , { animationType: 'fade', maskClosable: false, onMaskClose: () => { } })

            } else {
                this.showAlertView('国内火车票:不限');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    componentDidMount() {
        this._loadList();
        this._getCity();
        this._customerInfo();
    }

    _getCity = () =>{
        StorageUtil.loadKeyId(Key.TrainCitysData).then(response => {//城市列表
            this.setState({
                cityList:response
            })
        })
    }
    _customerInfo= () =>{
        const {customerInfo} = this.state;
        UserInfoDao.getCustomerInfo(this.props.comp_userInfo&&this.props.comp_userInfo.IdModel).then(customerInfo => {
            this.setState({
                customerInfo
            })
        }).catch(error => {
            this.toastMsg(error.message);
        })   
    }

    _loadList = () => {
        const { fromCityCode, toCityCode, departureDate } = this.params.queryModel;
        let model = {
            DepartureCode: fromCityCode,
            DestinationCode: toCityCode,
            DepartureDate: departureDate.format('yyyy-MM-dd', true),
            FeeType: this.props.feeType,
            IsReissueQuery: this.params.reissueOrder ? 1 : 0,
            OrderId:this.params.reissueOrder&&this.params.reissueOrder.Id,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
        }
        this.showLoadingView();
        TrainService.query(model).then(response => {
            this.hideLoadingView();
            if (response && Array.isArray(response)) {
                if (response.length === 0) {
                    this.setState({
                        showErrorMessage: '没有符合条件的车次啦~'
                    })
                    return;
                }
                let from_stationList = []
                let to_stationList = []
                response.forEach(item => {
                    if (!from_stationList.includes(item.from_station_name)) {
                        from_stationList.push(item.from_station_name);
                    }
                    if (!to_stationList.includes(item.to_station_name)) {
                        to_stationList.push(item.to_station_name);
                    }                   
                })

                this.setState({
                    dataList: response,
                    from_stationList:from_stationList,
                    to_stationList:to_stationList,
                }, () => {
                    if (this.state.bottomIndex !== 0) {
                        this._renderBottomFilter(this.state.bottomIndex);
                    }
                })
            } else {
                this.setState({
                    showErrorMessage: response.message || '获取火车票列表失败'
                })
                this.toastMsg(response.message || '获取火车票列表失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.setState({
                showErrorMessage: error.message || '获取火车票列表异常'
            })
            this.toastMsg(error.message || '获取火车票列表异常');
        })
    }

    /**
     *  选择日期
     */
    _selectDate = () => {
        const { queryModel } = this.params;
        this.push('Calendar', {
            from: 'train',
            date: queryModel.departureDate,
            backDate: (date) => {
                queryModel.departureDate = date;
                this.setState({
                    dataList: [],
                }, () => {
                    this._loadList();
                })
            }
        })
    }
    /**
     *  选择前一天
     */
    _theDayBefore = () => {
        const { queryModel } = this.params;
        if (queryModel.departureDate.format('yyyy-MM-dd') === new Date().format('yyyy-MM-dd')) {
            this.toastMsg('不能再往前了');
        } else {
            queryModel.departureDate = queryModel.departureDate.addDays(-1);
            this.setState({
                dataList: [],
            }, () => {
                this._loadList();
            })
        }
    }
    /**
     *  选择后一天
     */
    _theDayAfter = () => {
        const { queryModel } = this.params;
        queryModel.departureDate = queryModel.departureDate.addDays(1);
        this.setState({
            dataList: [],
        }, () => {
            this._loadList();
        })
    }
    /**
     *  执行下一步操作
     */
    _nextStation = (item,index) => {
        const { fromCityName, fromCityCode, toCityName, toCityCode, departureDate } = this.params.queryModel
        const {dataList, customerInfo,cityList} = this.state;
        let recommendArr=[]
        if (!dataList||dataList.length==0){
            return
        }
        /**判断车票售空时 推荐抢票数据 选中的item的前两个或后两个 */
        if((dataList.length-(index+1))>1&&index>1){
            recommendArr=[dataList[index-1],dataList[index-2],dataList[index+1],dataList[index+2]]
        }else if((dataList.length-(index+1))>1&&index==1){
            recommendArr=[dataList[index-1],dataList[index+1],dataList[index+2]]
        }else if((dataList.length-(index+1))>1&&index==0){
            recommendArr=[dataList[index+1],dataList[index+2]]
        }
        else if((dataList.length-(index+1))==1&&index>1){
            recommendArr=[dataList[index-1],dataList[index-2],dataList[index+1]]
        }else if((dataList.length-(index+1))==1&&index==1){
            recommendArr=[dataList[index-1],dataList[index+1]]
        }else if((dataList.length-(index+1))==1&&index==0){
            recommendArr=[dataList[index+1]]
        }
        else if((dataList.length-(index+1))==0&&index>1){
            recommendArr=[dataList[index-1],dataList[index-2]]
        }else if((dataList.length-(index+1))==0&&index==1){
            recommendArr=[dataList[index-1]]
        }else if((dataList.length-(index+1))==0&&index==0){
            recommendArr=[]
        }
        let arr = []
        item.SearchFromCity = {
            fromCityName,
            fromCityCode,
        }
        item.SearchToCity = {
            toCityName,
            toCityCode
        }
        let hasSeat = item.ticketTypes.some(ticket => ticket.seatCount > 0);
        if (hasSeat && item.can_buy_now === 'Y') {
            this.push('TrainTicketScreen', {
                ticket: item,
                reissueOrder: this.params.reissueOrder,
                departureDate: departureDate,
                feeType: this.props.feeType,
                recommendTrain:recommendArr,
                JourneyId:this.params.JourneyId,
                cityList,cityList
            })
        }else  if(item.can_buy_now==='N'){
            this.toastMsg('该车次车票未开售');
        }else {
            if (customerInfo.Setting&&customerInfo.Setting.TrainGrabTicket) {
                this.push('TrainTicketScreen', {
                    ticket: item,
                    reissueOrder: this.params.reissueOrder,
                    departureDate: departureDate,
                    feeType: this.props.feeType,
                    recommendTrain:recommendArr,
                    JourneyId:this.params.JourneyId,
                    cityList,cityList
                })
            } else{
                this.toastMsg('该车次车票已售完');
            }
        }
    }

    _refreshPage = () => {
        this.setState({
            dataList: [],
            showErrorMessage: "",
            recordList: []
        }, () => {
            this._loadList();
        })
    }

    _renderHeader = () => {
        const { departureDate } = this.params.queryModel;
        return (
            <View style={styles.headerView}>
                <TouchableOpacity onPress={this._theDayBefore} style={{flexDirection:'row',alignItems:'center'}}>
                    <AntDesign name={'left'} size={14} color={Theme.assistFontColor} />
                    <CustomText style={{ color: Theme.theme }} text='前一天' />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerCenter} onPress={this._selectDate}>
                    <CustomText style={{ color: Theme.theme }} text={departureDate && (departureDate.format('MM-dd') + ' ' + departureDate.getWeek())} />
                </TouchableOpacity>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <TouchableOpacity onPress={this._theDayAfter}>
                        <CustomText style={{ color: Theme.theme }} text='后一天' />
                    </TouchableOpacity>
                    <AntDesign name={'right'} size={14} color={Theme.assistFontColor} />
                </View>
            </View>
        );
    }
    /**
     *  筛选
     */
    _renderBottomFilter = (index) => {
        const { departureDate } = this.params.queryModel;
        switch (index) {
            case 0:
                this.state.dataList.sort((a, b) => {
                    let aDep = Util.Date.toDate(`${departureDate.format('yyyy-MM-dd', true)} ${a.start_time}`);
                    let bDep = Util.Date.toDate(`${departureDate.format('yyyy-MM-dd', true)} ${b.start_time}`);
                    return aDep - bDep;
                })
                break;

            // case 1:
            //     this.state.dataList.sort((a, b) => {
            //         let aDiff = departureDate.addDays(+a.arrive_days);
            //         let bDiff = departureDate.addDays(+b.arrive_days);
            //         let aDep = Util.Date.toDate(`${aDiff.format('yyyy-MM-dd', true)} ${a.arrive_time}`);
            //         let bDep = Util.Date.toDate(`${bDiff.format('yyyy-MM-dd', true)} ${b.arrive_time}`);
            //         return aDep - bDep;
            //     })
            //     break;
            case 1:
                this.state.dataList.sort((a, b) => {
                    return parseInt(a.run_time_minute) - parseInt(b.run_time_minute);
                })
                break;
            case 2:
                this.push('TrainFilterScreen', {
                    callBack: (isFilter, filterOptions) => {
                        this.setState({
                            isFilter: isFilter,
                            filterOptions: filterOptions
                        })
                    },
                    list: this.state.dataList,
                    filterOptions: this.state.filterOptions
                });
                return;
        }

        this.setState({
            bottomIndex: index
        })
    }
    _renderBottom = () => {
        let array = ['出发', '耗时', '筛选'];
        let imaArr = [require('../../res/Uimage/IntFlightFloder/_timeb.png'),require('../../res/Uimage/flightFloder/time_circle2.png'),require('../../res/Uimage/flightFloder/filter.png')]
        const { bottomIndex, isFilter } = this.state;
        return (
                <View style={{ backgroundColor: "#fff", height: 50, flexDirection: 'row',borderTopWidth:2,borderColor:Theme.greenBg }}>
                    {
                        array.map((item, index) => {
                            return (
                                <TouchableOpacity key={index} underlayColor='transparent' onPress={this._renderBottomFilter.bind(this, index)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <Image source={imaArr[index]} style={{ width: 22, height: 22, tintColor: bottomIndex === index || (isFilter && index === array.length - 1) ? Theme.theme : Theme.darkColor, }}></Image>
                                    <CustomText text={item} style={{ color: bottomIndex === index || (isFilter && index === array.length - 1) ? Theme.theme : Theme.darkColor,fontSize:11,marginTop:2 }} />
                                    {/* <Text style={{ color: bottomIndex === index || (isFilter && index === array.length - 1) ? Theme.theme : Theme.darkColor }}>{index ===3?'':'↓'}</Text> */}
                                </TouchableOpacity>
                            )
                        })
                    }
                </View>
        )
    }
    /**
     * 行内容
     */
    _renderItem = ({ item,index}) => {
        return (
            <LisItemView item={item} highRisk={this.props.highRisk} 
                index={index} trainlistCallBack={this._showDetail}  
                callBack={this._nextStation} 
                filterOptions={this.state.filterOptions} cityList={this.state.cityList}
            />
        )
    }
    _renderError = () => {
        const { showErrorMessage } = this.state;
        return (
            <View style={{ flex: 1,marginTop:20 }}>
                {
                    showErrorMessage === '网络超时，请检查您的网络' || showErrorMessage === 'Network request failed' ?
                        <NetworkFaildView refresh={this._refreshPage} /> :
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <CustomText style={{ color: 'gray' }} text={showErrorMessage || '没有符合条件的车次啦~'} />
                        </View>
                }
            </View>
        )
    }
    renderBody() {
        const { dataList, showErrorMessage } = this.state;
        return (
            <View style={{ flex: 1 }}>
                {this._renderHeader()}
                {this._choseStation()}
                {
                    dataList.length === 0 && (showErrorMessage || this.state.isFilter) ?
                    this._renderError()
                    :
                    this._choseStation2()
                }
                {
                    <View style={{marginTop:-20,flex:1}}>
                        <FlatList
                            data={dataList}
                            showsVerticalScrollIndicator={false}
                            renderItem={this._renderItem}
                            keyExtractor={(item, index) => String(index)}
                        />
                    </View>
                }
                <TrainlistView ref={o => this.priceView = o} />
                {this._renderBottom()}
            </View>
        )
    }
    _showDetail = (data,index) => {
        console.log();
       const { departureDate } =  this.params.queryModel
       data.departureDate = departureDate.format('yyyy-MM-dd', true);
        this.priceView.show(data);
    }
    _choseStation=()=>{
        const {from_stationList,to_stationList,filterOptions} = this.state
        return(
            <View style={{}}>
                <View style={{flexDirection:'row',alignItems: 'center',height:40}}>
                    {/* <CustomText text={'出发'} ></CustomText> */}
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                        <View style={{flexDirection:'row'}} >
                        {/* <TouchableOpacity onPress={()=>{this.clickAdition('不限') }} style={{borderWidth:1,padding:2,paddingHorizontal:6,marginLeft:5,borderRadius:4,borderColor:filterOptions['FromStations']=='不限'?Theme.theme:'#fff',backgroundColor:filterOptions['FromStations']=='不限'?Theme.greenBg:'#fff'}}>
                            <CustomText text={'不限'} ></CustomText>
                        </TouchableOpacity> */}
                        {
                            from_stationList&& from_stationList.map((item)=>{
                                return(
                                    <TouchableOpacity onPress={()=>{this.clickAdition(item) }} style={{borderWidth:1,padding:2,paddingHorizontal:6,marginLeft:5,borderRadius:4,
                                    borderColor:filterOptions['FromStations2'].includes(item)?Theme.theme:'#fff',
                                    backgroundColor:filterOptions['FromStations2'].includes(item)?Theme.greenBg:'#fff'}}>
                                    <CustomText text={item} ></CustomText>
                                    </TouchableOpacity>
                                )
                            })
                        }
                        {
                            to_stationList.map((item)=>{
                                return(
                                <TouchableOpacity onPress={()=>{this.clickAdition(item,2) }} style={{borderWidth:1,padding:2,paddingHorizontal:6,marginLeft:5,borderRadius:4,
                                borderColor:filterOptions['ToStations2'].includes(item)?Theme.theme:'#fff',
                                backgroundColor:filterOptions['ToStations2'].includes(item)?Theme.greenBg:'#fff'}}>
                                    <CustomText text={item}></CustomText>
                                </TouchableOpacity>
                                )
                            })
                        }
                        </View>
                    </ScrollView>
                </View>
                {/* <View style={{flexDirection:'row',alignItems: 'center',height:40}}>
                    <CustomText text={'到达'} ></CustomText>
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
                        <View style={{flexDirection:'row'}} >
                        <TouchableOpacity onPress={()=>{this.clickAdition('不限',2) }} style={{borderWidth:1,padding:2,paddingHorizontal:6,marginLeft:5,borderRadius:4,borderColor:filterOptions['ToStations']=='不限'?Theme.theme:'#fff',backgroundColor:filterOptions['ToStations']=='不限'?Theme.greenBg:'#fff'}}>
                            <CustomText text={'不限'} ></CustomText>
                        </TouchableOpacity>
                        {
                            to_stationList.map((item)=>{
                                return(
                                <TouchableOpacity onPress={()=>{this.clickAdition(item,2) }} style={{borderWidth:1,padding:2,paddingHorizontal:6,marginLeft:5,borderRadius:4,borderColor:filterOptions['ToStations']==item?Theme.theme:'#fff',backgroundColor:filterOptions['ToStations']==item?Theme.greenBg:'#fff'}}>
                                    <CustomText text={item}></CustomText>
                                </TouchableOpacity>
                                )
                            })
                        }
                        </View>
                    </ScrollView>
                </View> */}
            </View>
        )
    }
    _choseStation2=()=>{
        return(
            <View style={{}}>
                <View style={{flexDirection:'row',alignItems: 'center',height:20,justifyContent:'center'}}>
                <CustomText style={{ color: 'gray' }} text={'没有符合条件的车次啦~'} />
                </View>
            </View>
        )
    }
    
    clickAdition=(item, index)=>{
        if(index==2){
            //如果this.state.filterOptions包含item，则删除
            if(this.state.filterOptions['ToStations2'].includes(item)){
                this.state.filterOptions['ToStations2'].splice(this.state.filterOptions['ToStations2'].indexOf(item),1)
            }else{
                this.state.filterOptions['ToStations2'].push(item)
            }  
        }else{
            //如果this.state.filterOptions包含item，则删除
            if(this.state.filterOptions['FromStations2'].includes(item)){
                this.state.filterOptions['FromStations2'].splice(this.state.filterOptions['FromStations2'].indexOf(item),1)
            }else{
            this.state.filterOptions['FromStations2'].push(item)
            }
        }
        this.setState({
            isFilter: true,
            filterOptions: this.state.filterOptions
        },()=>{
            this._loadList();
        })
    }
}
const getStateProps = state => ({
    feeType: state.feeType.feeType,
    highRisk:state.highRisk.highRisk,
    comp_userInfo:state.comp_userInfo,
})
export default connect(getStateProps)(TrainListScreen);

const styles = StyleSheet.create({
    header: {
        height: 50,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    headerView: {
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        justifyContent:'space-between',
        paddingHorizontal:10
    },
    headerCenter: {
        height: 20,
        backgroundColor: Theme.greenBg,
        // flex: 4,
        borderRadius: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal:18
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    alertStyle: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
    },
})