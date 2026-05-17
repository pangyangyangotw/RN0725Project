import React from 'react';
import {
    View,
    StyleSheet,
    SectionList,
    TouchableHighlight,
    Image,
    TouchableOpacity
} from 'react-native';
import SuperView from '../../super/SuperView';
import I18nUtil from '../../util/I18nUtil';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import LowPriceView from './LowPriceView';
import MorePriceView from './MorePriceView';
import FlightService from '../../service/FlightService';
import { connect } from 'react-redux';
import StorageUtil from '../../util/StorageUtil';
import Key from '../../res/styles/Key';
import ViewUtil from '../../util/ViewUtil';
import Util from '../../util/Util';
import NetworkFaildView from '../../custom/NetWorkFaildView';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ListBottomView from './ListBottomView';
import RuleView from './RuleView';
import RuleView2 from './RuleView2';
import ListLowPriceView from './ListLowPriceView';
import GoFlightDetailView from './GoFlightDetailView';
import airlines from '../../res/js/airline';
import UserInfoDao from '../../service/UserInfoDao';
import CommonService from '../../service/CommonService';
import AntDesign from 'react-native-vector-icons/AntDesign';

class FlightRtListScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: I18nUtil.translate(this.params.moreTravel? this.params.goCityData2.Name : this.params.goCityData.Name) + '-' + I18nUtil.translate(this.params.moreTravel?this.params.arrivalCityData2.Name:this.params.arrivalCityData.Name)
        },
            this._tabBarBottomView = {
                bottomInset: true,
                bottomColor: 'white'
            }
        if(this.params.filterArr&&this.params.filterArr.length>0){
            const reasonCopy = JSON.parse(JSON.stringify(this.params.filterArr[1].data))
            this.params.filterArr[1].data=this.params.filterArr[2].data
            this.params.filterArr[2].data=reasonCopy
        }
            this.state = {
            bottomBtnIndex: 0,
            sectionLists: [],
            showErrorMessage: '',
            recordSection: [],
            // filterArr: [
            //     { title: '起飞时间', data: '不限' },
            //     { title: '出发机场', data: ['不限'] },
            //     { title: '到达机场', data: ['不限'] },
            //     { title: '航司', data: ['不限'] },
            //     { title: '舱位', data:this.params.ResBookDesig?this.params.ResBookDesig.data:'不限' }
            // ],
            filterArr:this.params.filterArr,
            isFilter: this.params.isFilter? true : false,
            isDirect: this.params?.isDirect? this.params.isDirect : false,
            // isDirect: false,
            isShare: this.params?.isShare===false? this.params.IsShare : true,
            currentLowPrice: 0,
            customer_info:{},
            user_info:{},
            craftTypeList: [],
        }
    }

    componentDidMount() {
        this._loadInfo();
        this._loadLowPrice();
        StorageUtil.loadKey(Key.CraftTypeList).then(result => {
            this.setState({ 
                craftTypeList : result || []
            });
        })
    }

    _loadInfo(){
        UserInfoDao.getUserInfo().then(user_info => {
            let referencEmployeeId
            if(this.props.comp_userInfo&&this.props.comp_userInfo.employees&&this.props.comp_userInfo.employees.length>0){
                let num = this.props.comp_userInfo&&this.props.comp_userInfo.employees.length-1
                referencEmployeeId = this.props.comp_userInfo.employees[num]&&this.props.comp_userInfo.employees[num].PassengerOrigin&&this.props.comp_userInfo.employees[num].PassengerOrigin.EmployeeId
            }else{
                referencEmployeeId = user_info.Id
            }
            let model={
                ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
                ReferencePassengerId:referencEmployeeId,
            }
            CommonService.customerInfo(model).then(response => {
                if (response && response.success) {
                    this.setState({
                        customer_info: response.data,
                        user_info: user_info
                    })
                } 
            })
        })
    }

    /** 
     * 舱位代码
     */
    _getCarbinCode = (data) => {
        let obj = this.state.filterArr.find(item => item.title === '舱位');
        switch (data || obj.data) {
            case '头等舱':
                return 'F';
            case '商务舱/公务舱':
                return 'C-J-F';
            case '超值经济舱':
                return 'W';
            case '经济舱':
                return 'Y';
        }
    }

    _filterCanbin = (data) => {
        let arr = [];
        data.forEach(item => {
            let journey = item.lowPrice[0];
            let isGoAir = false;
            let isArrivalAir = false;
            let isTime = false;
            let isAirLine = false;
            let isShare = true;
            this.state.filterArr.forEach(filter => {
                if (filter.title === '出发机场') {
                    for (let i = 0; i < filter.data.length; i++) {
                        const obj = filter.data[i];
                        if (obj === '不限' || obj.cn === journey.DepartureAirportDesc) {
                            isGoAir = true;
                            break;
                        }
                    }
                }
                if (filter.title === '到达机场') {
                    for (let i = 0; i < filter.data.length; i++) {
                        const obj = filter.data[i];
                        if (obj === '不限' || obj.cn === journey.ArrivalAirportDesc) {
                            isArrivalAir = true;
                            break;
                        }
                    }
                }
                if (filter.title === '航司') {
                    for (let i = 0; i < filter.data.length; i++) {
                        const obj = filter.data[i];
                        if (obj === '不限' || obj.cn === journey.AirCodeDesc) {
                            isAirLine = true;
                            break;
                        }
                    }
                }
                if (filter.title === '起飞时间') {
                    if (filter.data === '不限') {
                        isTime = true;
                    } else {
                        const first = filter.data.split('-')[0].split(':')[0];
                        const last = filter.data.split('-')[1].split(':')[0];
                        const hours = Util.Date.toDate(journey.DepartureTime).getHours();
                        if (Number(first) <= hours && hours < Number(last)) {
                            isTime = true;
                        }
                    }
                }
            })
            if (!this.state.isShare) {
                if (journey.fltInfo && journey.fltInfo.codeShareLine) {
                    isShare = false;
                }
            }
            if (isGoAir && isArrivalAir && isTime && isAirLine && isShare) {
                if (this.state.isDirect) {
                    if (!+journey.fltInfo.Stop) {
                        arr.push(item);
                    }
                } else {
                    arr.push(item);
                }
            }
        })
        this.setState({
            sectionLists: arr,
            recordSection: data
        }, () => {
            if (this.state.bottomBtnIndex == 2) {
                this._bottomSelectClick(2);
            }
        })
    }
    /**
     *  加载最低价
     */
    _loadLowPrice = () => {
        const { arrivalCityData, goCityData, goDate,arrivalCityData2, goCityData2,moreTravel,arrivalDate } = this.params;
        const { feeType,compReferenceEmployee,apply } = this.props;
        const { filterArr } = this.state;
        // let compReferenceEmployeeId = compReferenceEmployee&&compReferenceEmployee&&compReferenceEmployee.PassengerOrigin&&compReferenceEmployee.PassengerOrigin.EmployeeId
        let canbin = 'Y';
        let journeyid = 0;
        if(this.state.isFilter){
            filterArr.map(item => {
                if (item.title === '舱位') {
                    canbin = this._getCarbinCode(item.data);
                }
            })
        }
        if(apply){
            if(apply.TravelApplyMode==1 && apply.JourneyList && apply.JourneyList.length>0){
                //行程模式
                if(apply.selectApplyItem){
                    journeyid = apply.selectApplyItem&&apply.selectApplyItem.Id
                }else{
                    apply.JourneyList.forEach((item,index)=>{
                        if(item?.BusinessCategory & 1){
                           journeyid = item.Id
                        }
                    })
                }
            }else{
                //目的地模式
                journeyid = apply.Id
            }
        }
        let model = {
            ArrivalAirport: moreTravel ? arrivalCityData2.Code : arrivalCityData.Code,
            ArrivalCityName: moreTravel ? arrivalCityData2.Name : arrivalCityData.Name,
            DepartureAirport: moreTravel ? goCityData2.Code : goCityData.Code,
            DepartureCityName: moreTravel ? goCityData2.Name : goCityData.Name,
            DepartureDateTime: arrivalDate.format('yyyy-MM-dd', true),
            // DepartureDateTime: goDate.format('yyyy-MM-dd', true),
            FeeType: feeType,
            ResBookDesigCode: canbin,
            ShowDiffrentSupplierPrice: true,
            RulesTravelId:compReferenceEmployee&&compReferenceEmployee.RulesTravelId,
            ApplyId: apply?.Id || 0,
            JourneyId: journeyid
        }
        let lowPricePromise = FlightService.GetFlightLowPrice(model);

        this.showLoadingView();
        lowPricePromise.then(response => {
            this.hideLoadingView();
            StorageUtil.saveKeyId(Key.FlightRtListStopTime, new Date().format('yyyy-MM-dd HH:mm:ss'))
            if (response && response.success) {
                if (!response.data) {
                    this.setState({
                        showErrorMessage: '没有符合条件的航班了'
                    })
                    return;
                }
                let sectionList = [];
                response.data.forEach((obj, index) => {
                    
                    if (obj.flightDisPlayInfo && Array.isArray(obj.flightDisPlayInfo) && obj.flightDisPlayInfo.length > 0) {
                        sectionList.push({ lowPrice: obj.flightDisPlayInfo, isOpen: false, data: [] });
                    }
                    let playInfo = obj.flightDisPlayInfo[0];
                    if (index === 0) {
                        this.state.currentLowPrice = playInfo.Price;
                    }
                    if (this.state.currentLowPrice > playInfo.Price) {
                        this.state.currentLowPrice = playInfo.Price;
                    }
                })
                if (this.state.isFilter || this.state.isDirect) {
                    this._filterCanbin(sectionList);
                    return;
                }
                this.setState({
                    showErrorMessage: '',
                    recordSection: [].concat(sectionList),
                    sectionLists: sectionList
                }, () => {
                    if (this.state.bottomBtnIndex === 2) {
                        this._bottomSelectClick(this.state.bottomBtnIndex);
                    }
                })
            } else {
                this.toastMsg(response.message || '获取数据失败请重试');
                this.setState({
                    showErrorMessage: response.message || '获取数据失败请重试'
                })
            }
        }).catch(error => {
            this.hideLoadingView();
            if (error.message !== '网络超时，请检查您的网络' || error.message !== 'Network request failed') {
                this.toastMsg(error.message || '获取数据失败请重试');
            }
            this.setState({
                showErrorMessage: error.message || '获取数据失败请重试'
            })
        })
    }
    /**
     *  加载更多价格
     */
    _loadMorePrice = (section) => {
        const { ArrivalCityName, arrivalCityData,arrivalCityData2,goCityData2, DepartureCityName, goCityData, DepartureDateTime, goDate,arrivalDate,moreTravel } = this.params;
        const {compReferenceEmployee} = this.props;
        const { user_info, customer_info,filterArr } = this.state;
        // let compReferenceEmployeeId = compReferenceEmployee&&compReferenceEmployee.PassengerOrigin&&compReferenceEmployee.PassengerOrigin.EmployeeId

        // if (section && section.data && section.data.length > 0) {
        //     section.isOpen = !section.isOpen;
        //     this.setState({});
        // } else {
        let canbin = 'Y';
        if(this.state.isFilter){
            filterArr.map(item => {
                if (item.title === '舱位') {
                    canbin = this._getCarbinCode(item.data);
                }
            })
        }
        let obj = section.lowPrice[section.lowPrice.length - 1];
        obj.fltInfo.cabinClassJson = obj.cabinClassInfo;
        let model = {
            AirCode: obj.AirCode,
            ArrivalAirport: obj.ArrivalAirport,
            ArrivalCityName:moreTravel  ? arrivalCityData2.Name : arrivalCityData.Name,
            ArrivalCityCode: moreTravel ? arrivalCityData2.Code : arrivalCityData.Code,
            DepartureAirport: obj.DepartureAirport,
            DepartureCityName: moreTravel ? goCityData2.Name : goCityData.Name,
            DepartureCityCode: moreTravel ? goCityData2.Code : goCityData.Code,
            DepartureAirport: obj.DepartureAirport,
            DepartureDateTime: arrivalDate.format('yyyy-MM-dd', true),
            IsDirect: this.state.isDirect,
            JourneyType: 'OW',
            LowestOrAll: 'A',
            MoreFlightJson: JSON.stringify([obj.fltInfo]),
            cabinClassJson: JSON.stringify(obj.cabinClassInfo),
            SupplierType: obj.SupplierType,
            SegHeadId: obj.ProductId,
            DataId: obj.DataId,
            FeeType: this.props.feeType,
            RulesTravelId:compReferenceEmployee&&compReferenceEmployee.RulesTravelId?compReferenceEmployee.RulesTravelId:user_info.RulesTravelId,
            ResBookDesigCode:canbin==='W'?'Y-W':canbin,
        }
        this.push('FlightRtMorePrice', { 
            ...this.params,
            request: model, 
            section: section, 
            feeType: this.props.feeType,
            RulesTravelId:compReferenceEmployee&&compReferenceEmployee.RulesTravelId?compReferenceEmployee.RulesTravelId:user_info.RulesTravelId,
            customerInfo: customer_info,
            userInfo: user_info
         });
        return;
    }
    /**
     *  加载更多数据之前，进行日期数据比较
     */

    _judgeIsLoadLow = (section) => {
        StorageUtil.loadKeyId(Key.FlightRtListStopTime).then(response => {
            if (response && (new Date().getTime() - Util.Date.toDate(response).getTime() >= 10 * 60 * 1000)) {
                this.showAlertView('终于回来了，航班可能有变化，将为您重新查询', () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                        this.pop();

                    }, '确定', () => {
                        StorageUtil.saveKeyId(Key.FlightRtListStopTime, new Date().format('yyyy-MM-dd HH:mm:ss'))
                        this.setState({
                            sectionLists: []
                        }, () => {
                            this.dismissAlertView();
                            this._loadLowPrice();
                        })
                    })
                })
            } else {
                this._loadMorePrice(section);
            }
        }).catch(error => {
            this._loadMorePrice(section);
        })
    }
    /**
     *  点击预订按钮的操作
     */
    _orderBtnClick = (data) => {
        if (data && data.DepartureAirport === 'PKX') {
            this.showAlertView('大兴机场距离市区46公里，搭乘地铁到市区（草桥站）需约30分钟', () => {
                return ViewUtil.getAlertButton('确定', () => {
                    this.dismissAlertView();
                    this._getTravelRule(data);
                })
            })
        } else {
            this._getTravelRule(data);
        }
    }


    /**
     *  差旅规则鉴定
     */

    _getTravelRule = (data) => {
        const { isSingle, arrivalCityData, goCityData } = this.params;
        const { compSwitch } = this.props;

        /**
         *  因私预订
         */
        let params = Util.Encryption.clone(this.params);
        params.backFlightData = data;
        if (this.props.feeType === 2) {
            this.push('FlightOrderScreeb', params);
            return;
        }
        let model = {
            DepartureCityName: data.DepartureCityName,
            DepartureCode: goCityData.Code,
            DestinationCityName: data.ArrivalCityName,
            DestinationCode: arrivalCityData.Code,
            DepartureTime: data.DepartureTime,
            DepAirport:data.ArrivalAirport,
            ArrAirport:data.DepartureAirport,
            Price: data.Price,
            Airline: data.AirCode,
            AirlineNumber: data.FlightNumber,
            AirPlace: data.ResBookDesigCode,
            Discount: data.DiscountRate,
            DataId: data.DataId,
            AirServiceCabin: data.AirServiceCabin,
            PriceId:data.PriceId,
            ShowLowerPrice:data.MorePriceTag?false:true,
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId
        }
        this.showLoadingView('差旅规则检查');
        FlightService.MatchTravelRules(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data.unmatchlist && Array.isArray(response.data.unmatchlist) && response.data.unmatchlist.length > 0) {
                    for (const obj of response.data.unmatchlist) {
                        if (obj.IsEnable && obj.RuleType === 1 && obj.LowPriceFight) {
                            params.MatchTravelRules = response.data;
                            this.refs.lowPriceBottomView.showView(params);
                            return;
                        }
                    }
                    for (const obj of response.data.unmatchlist) {
                        if (obj.IsEnable && obj.Advanceday && obj.RuleType === 2) {
                            params.MatchTravelRules = response.data;
                            this.push('FlightRtRule', params);
                            break;
                        }
                        if (obj.IsEnable && obj.Discount && obj.RuleType === 7) {
                            params.MatchTravelRules = response.data;
                            this.push('FlightRtRule', params);
                            break;
                        }
                    }
                } else {
                    compSwitch?
                    this.push('Flight_compCreatOrderScreen', params)
                    :
                    this.push('FlightOrderScreeb', params);
                }
            } else {
                if (response.code === "NoBooking4LowestPrice") {
                    params.bookLowestPrice = response.data;
                    this.refs.lowPriceView.showView(params);
                } else {
                    this.toastMsg(response.message || '差旅规则检测失败');
                }
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '差旅规则检测失败')
        })

    }



    /**
     *  修改日期 index=1是减 =2加
     */
    _changeDate = (index) => {
        if (index === 1) {
            let today = new Date();

            if (today.format('yyyy-MM-dd') === this.params.goDate.format('yyyy-MM-dd')) {
                this.toastMsg('所选时间不能小于当前时间');
                return;
            }
            this.params.goDate = this.params.goDate.addDays(-1);
        } else {
            this.params.goDate = this.params.goDate.addDays(1);
        }
        this.setState({ sectionLists: [], showErrorMessage: '' }, () => {
            this._loadLowPrice();
        });
    }
    /**
     *  筛选 index 1,2,3
     */
    _bottomSelectClick = (index) => {
        switch (index) {
            case 1:
                this.state.sectionLists.sort((obj1, obj2) => {
                    let DepartureTime1 = obj1.lowPrice[0]['DepartureTime'];
                    let DepartureTime2 = obj2.lowPrice[0]['DepartureTime'];
                    return Util.Date.toDate(DepartureTime1) - Util.Date.toDate(DepartureTime2);
                })
                this.setState({
                    bottomBtnIndex: 1
                })
                break;
            case 2:
                this.state.sectionLists.sort((obj1, obj2) => {
                    let price1 = obj1.lowPrice[0]['Price'];
                    let price2 = obj2.lowPrice[0]['Price'];
                    return price1 - price2;
                })
                this.setState({
                    bottomBtnIndex: 2
                })
                break;
            case 3:
                this.push('FloghtCotidionScreen', {
                    refresh: (data, filter, isDirect, isFilter, isShare) => {
                        this.setState({
                            sectionLists: data,
                            filterArr: filter,
                            isDirect,
                            isFilter,
                            isShare
                        }, () => {
                            this._bottomSelectClick(this.state.bottomBtnIndex);
                        })
                    }, load: (filter, isDirect, isFilter, isShare) => {
                        this.setState({
                            sectionLists: [],
                            filterArr: filter,
                            isDirect,
                            isFilter,
                            isShare
                        }, () => {
                            this._loadLowPrice();
                        })
                    },
                    data: [].concat(this.state.recordSection),
                    filter: this.state.filterArr,
                    isDirect: this.state.isDirect,
                    isShare: this.state.isShare,
                    canbinOption:this.params.canbinOption,
                    ResBookDesig:this.params.ResBookDesig,
                });
                break;
        }
    }
    /**
     *  点击刷新
     */
    _refreshPage = () => {
        this.setState({
            sectionLists: [],
            showErrorMessage: ''
        }, () => {
            this._loadLowPrice();
        })
    }

    _renderHeaderDateSelect = () => {
        const { goDate, DepartureDateTime, arrivalDate } = this.params;
        return (
            <View style={styles.headerView}>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <AntDesign name={'left'} size={14} color={Theme.assistFontColor} />
                    <CustomText style={{fontSize:14, marginLeft:5}} onPress={this._changeDate.bind(this, 1)}
                        text='前一天'
                    />
                </View>
                <View style={styles.headerCenter}>
                    <CustomText style={{ color: Theme.theme}}
                        text={arrivalDate.format(' MM-dd') + ' ' + arrivalDate.getWeek()}
                    />
                </View>
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <CustomText style={{fontSize:14, marginRight:5}} onPress={this._changeDate.bind(this, 2)}
                        text='后一天'
                    />
                    <AntDesign name={'right'} size={14} color={Theme.assistFontColor} />
                </View>
            </View>
        )
    }

    _renderBottomFilter = () => {
        const { bottomBtnIndex, isFilter } = this.state;
        return (
            <View style={styles.bottomView}>
                <TouchableOpacity underlayColor='transparent' onPress={this._bottomSelectClick.bind(this, 1)} style={styles.bottom_touch}>
                    <Image source={ bottomBtnIndex == 1 ? require('../../res/Uimage/flightFloder/time_circle.png'):require('../../res/Uimage/flightFloder/time_circle2.png')} style={{ width: 22, height: 22 }}></Image>
                    <CustomText style={{ color: bottomBtnIndex == 1 ? Theme.theme : 'gray',fontSize:11 }} text='从早到晚' />
                </TouchableOpacity>
                <TouchableOpacity underlayColor='transparent' onPress={this._bottomSelectClick.bind(this, 2)} style={styles.bottom_touch}>
                    <Image source={ bottomBtnIndex == 2  ? require('../../res/Uimage/flightFloder/_yuan2.png'):require('../../res/Uimage/flightFloder/_yuan.png')} style={{ width: 22, height: 22 }}></Image>
                    <CustomText style={{ color: bottomBtnIndex == 2 ? Theme.theme : 'gray',fontSize:11 }} text='价格排序' />
                </TouchableOpacity>
                <TouchableOpacity underlayColor='transparent' onPress={this._bottomSelectClick.bind(this, 3)} style={styles.bottom_touch}>
                    <Image source={ isFilter? require('../../res/Uimage/flightFloder/filter2.png'):require('../../res/Uimage/flightFloder/filter.png')} style={{ width: 22, height: 22 }}></Image>
                    <CustomText style={{ color: isFilter ? Theme.theme : 'gray',fontSize:11 }} text='筛选' />
                </TouchableOpacity>
            </View>
        )
    }
    _renderSectionHeader = ({ section }) => {
        return <LowPriceView 
        section={section} 
        highRisk={this.props.highRisk2} 
        lowThis={this} currentLowPrice={this.state.currentLowPrice} 
        loadMorePrice={this._judgeIsLoadLow.bind(this, section)} 
        craftTypeList={this.state.craftTypeList}
        />
    }
    _renderItem = (item) => {
        return <MorePriceView priceObj={item} {...this.params} feeType={this.props.feeType} moreThis={this} orderBtnClick={this._orderBtnClick.bind(this, item.item)} />
    }

    _renderError = () => {
        const { showErrorMessage } = this.state;
        return (
            <View style={{ flex: 1 }}>
                {
                    showErrorMessage === '网络超时，请检查您的网络' || showErrorMessage === 'Network request failed' ?
                        <NetworkFaildView refresh={this._refreshPage} /> :
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <CustomText style={{ color: 'gray' }} text={showErrorMessage || '没有符合条件的航班了'} />
                            <TouchableHighlight onPress={this._refreshPage} underlayColor='transparent'>
                                <Ionicons name={'ios-refresh'} size={25} color={'gray'} style={{ marginTop: 5 }} />
                            </TouchableHighlight>
                        </View>
                }
            </View>
        )
    }
    // 去程航班信息
    _renderGoFlightDetail = () => {
        const { goFlightData } = this.params;
        const depatureDate = Util.Date.toDate(goFlightData.DepartureTime);
        const arrivalDate = Util.Date.toDate(goFlightData.ArrivalTime);
        return (
            <TouchableHighlight underlayColor='transparent' onPress={()=>this.refs.goFlightDetail.show()}>
                <View style={{ flexDirection:'row',marginHorizontal: 10, backgroundColor: 'white',justifyContent: 'space-between',alignItems: 'center',borderRadius:5,padding:10,marginTop:10}}>
                    <View style={{  }}>
                        <View style={{ flexDirection:'row'}} >
                            <CustomText text={this.params.moreTravel?'第一程':'去程'} />
                            <CustomText text={'：'} />
                            <CustomText text={Util.Parse.isChinese()? goFlightData.AirCodeDesc: getAirlineEngliSHName(goFlightData.AirCode)} />
                            <CustomText text={`${goFlightData.AirCode}${goFlightData.FlightNumber} `} numberOfLines={2}/>
                        </View>
                        <View style={{marginTop:5}} >
                            <CustomText style={{color: Theme.commonFontColor,}} text={`${depatureDate.format('yyyy-MM-dd')} ${depatureDate.getWeek()} ${depatureDate.format('HH:mm')}-${arrivalDate.format('HH:mm')}`} numberOfLines={2}/>
                        </View>
                    </View>
                    <Ionicons name={'chevron-forward'} size={20} color={'lightgray'} />
                </View>
            </TouchableHighlight>
        )
    }

    renderBody() {
        const { sectionLists, showErrorMessage } = this.state;
        return (
            <View style={{ flex: 1 }}>
                {this._renderHeaderDateSelect()}
                {this._renderGoFlightDetail()}
                {
                    sectionLists.length === 0 && showErrorMessage ?
                        this._renderError()
                        :
                        <SectionList
                            sections={sectionLists}
                            renderSectionHeader={this._renderSectionHeader}
                            renderItem={this._renderItem}
                            keyExtractor={(item, idnex) => String(idnex)}
                            initialNumToRender={8}
                            stickySectionHeadersEnabled={false}
                            removeClippedSubviews={false}
                        />
                }
                {this._renderBottomFilter()}
                <ListBottomView ref='lowPriceBottomView' otwThis={this} isSingle={false} callBack={this._orderBtnClick} />
                <ListLowPriceView ref='lowPriceView' otwThis={this} isSingle={false} callBack={this._orderBtnClick} />
                <GoFlightDetailView ref='goFlightDetail' goFlightData = {this.params.goFlightData} moreTravel={this.params.moreTravel}/>
                <RuleView ref={o => this.ruleView = o} />
                <RuleView2 ref={o => this.ruleView2 = o} />
            </View>
        )
    }
}

const getPropsState = state => ({
    feeType: state.feeType.feeType,
    compSwitch: state.compSwitch.bool,
    compReferenceEmployee: state.compReferenceEmployee.ReferenceEmployee,//综合订单出差人选定参考出差人信息
    comp_userInfo:state.comp_userInfo,
    highRisk2:state.highRisk2.highRisk2,
    apply: state.apply.apply,
})

export default connect(getPropsState)(FlightRtListScreen);

const getAirlineEngliSHName = (airlineCode) => {
    if (airlines && Array.isArray(airlines)) {
        let index = airlines.findIndex(airline => (airline.Code === airlineCode));
        if (index === -1) {
            return null;
        }
        return airlines[index].EnFullName;
    }
}

const styles = StyleSheet.create({
    headerView: {
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        justifyContent:'space-between',
        paddingHorizontal:10
    },
    headerText: {
        flex: 3,
        color: Theme.fontColor,
        textAlign: 'center'
    },
    headerCenter: {
        height: 20,
        backgroundColor: Theme.greenBg,
        borderRadius: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal:18
    },
    bottomView: {
        height: 62,
        backgroundColor: 'white',
        flexDirection: 'row',
        borderTopWidth:1,
        borderTopColor:Theme.greenBg
    },
    bottom_touch: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
})