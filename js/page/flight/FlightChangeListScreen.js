import React from 'react';
import {
    View,
    Image,
    StyleSheet,
    FlatList,
    SectionList,
    DeviceEventEmitter,
    TouchableHighlight,
    TouchableOpacity,
    Text
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
import TrainService from '../../service/TrainService';
import LisItemView from '../train/ListItemView';
import AntDesign from 'react-native-vector-icons/AntDesign';

const dcCodes = ['D', 'G', 'GD', 'C', 'XGZ'];
class FlightChangeListScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: (I18nUtil.translate(this.params.DepartureCityName) + '-' + I18nUtil.translate(this.params.ArrivalCityName))
        },
            this._tabBarBottomView = {
                bottomInset: true,
                bottomColor: 'white'
            }
        this.state = {
            bottomBtnIndex: 1,
            sectionLists: [],
            showErrorMessage: '',
            recordSection: [],
            filterArr: [
                { title: '起飞时间', data: '不限' },
                { title: '出发机场', data: ['不限'] },
                { title: '到达机场', data: ['不限'] },
                { title: '航司', data: ['不限'] },
                { title: '舱位', data: '不限' },
                { title: '机型', data: '不限' }
            ],
            isFilter: false,
            isDirect: false,
            isShare: true,
            currentLowPrice: 0,
            currentBusinessType: 1, // 1和2表示机票还有火车票

            trainLowTrip: null,

            trainList: [],
            trainBottomIndex: 0,
            trainRecordList: [],
            isTrainFilter: false,
            trainFilterOptions: {
                FromStations: '不限',
                ToStations: '不限',
                TrainNewType:'不限',
                TrainGroup:'不限',
                FromTime:'不限',
                ToTime:'不限',
                TrainTicketType:'不限',
            },
            oldModel:this.params.oldModel,
            oldPolicySummary:this.params.oldPolicySummary,
        }
    }

    componentDidMount() {
        this._loadLowPrice();
        this._loadTrainLowPriceList();
        this.listener = DeviceEventEmitter.addListener(Key.FlightOrderCreateNotiList, () => {
            this.setState({ 
                sectionLists: [], 
                showErrorMessage: '', 
                trainList: [], 
                trainLowTrip: null, 
                currentLowPrice: 0 
            }, () => {
                this._loadLowPrice();
                this._loadTrainLowPriceList();
            });
        })
    }
    componentWillUnmount(){
        super.componentWillUnmount();
        this.listener && this.listener.remove();
    }


    // 处理火车票业务

    _loadTrainLowPriceList() {
        
    }

    geTainMinPrice(item) {
        let lowPrices = [];
        let check = item.IsCheckSeat == 1 && item.TrainSerat;
        if (dcCodes.includes(item.train_type)) {
            item.trainType = '高铁动车';
        } else {
            item.trainType = '普通列车';
        }
        const FlastTrain = [ 'G', 'GD', 'C', 'XGZ'];
        if(FlastTrain.includes(item.train_type)){
            if (+item.dw_price > 0) {
                lowPrices.push({
                    seat: '动卧',
                    seatCount: !isNaN(item.dw_num) || item.dw_num ? (+item.dw_num) : 0,
                    price: +item.dwx_price,
                    checkSeat: check ? check.is_checkdw_num : 1
                })
            }
            if (+item.gjrw_price > 0) {
                lowPrices.push({
                    seat: '高级软卧',
                    seatCount: !isNaN(item.gjrw_num) || item.gjrw_num ? (+item.gjrw_num) : 0,
                    price: +item.gjrw_price,
                    checkSeat: check ? check.is_checkgjrw_num : 1
                });
            }
            if (+item.edz_price > 0) {
                lowPrices.push({
                    seat: '二等座',
                    seatCount: !isNaN(item.edz_num) || item.edz_num ? (+item.edz_num) : 0,
                    price: +item.edz_price,
                    checkSeat: check ? check.is_checkedz_num : 1
                });
            }
            if (+item.ydz_price > 0) {
                lowPrices.push({
                    seat: '一等座',
                    seatCount: !isNaN(item.ydz_num) || item.ydz_num ? (+item.ydz_num) : 0,
                    price: +item.ydz_price,
                    checkSeat: check ? check.is_checkydz_num : 1
                });
            }
            if (+item.edw_price > 0) {
                lowPrices.push({
                    seat: '二等卧',
                    seatCount: !isNaN(item.edw_num) || item.edw_num ? (+item.edw_num) : 0,
                    price: +item.edwx_price,
                    checkSeat: check ? check.is_checkedw_num : 1
                });
            }
    
            if (+item.ydw_price > 0) {
                lowPrices.push({
                    seat: '一等卧',
                    seatCount: !isNaN(item.ydw_num) || item.ydw_num ? (+item.ydw_num) : 0,
                    price: +item.ydwx_price,
                    checkSeat: check ? check.is_checkydw_num : 1
                });
            }
            if (+item.swz_price > 0) {
                lowPrices.push({
                    seat: '商务座',
                    seatCount: !isNaN(item.swz_num) || item.swz_num ? (+item.swz_num) : 0,
                    price: +item.swz_price,
                    checkSeat: check ? check.is_checkswz_num : 1
                });
            }
            if (+item.tdz_price > 0) {
                lowPrices.push({
                    seat: '特等座',
                    seatCount: !isNaN(item.tdz_num) || item.tdz_num ? (+item.tdz_num) : 0,
                    price: +item.tdz_price,
                    checkSeat: check ? check.is_checktdz_num : 1
                });
            }
            if (+item.yxydz_price > 0) {
                lowPrices.push({
                    seat: '优选一等座',
                    seatCount: !isNaN(item.yxydz_num) || item.yxydz_num ? (+item.yxydz_num) : 0,
                    price: +item.yxydz_price,
                    checkSeat: check ? check.is_checktdz_num : 1
                });
            }
        }
        if (lowPrices.length > 0) {
            let lowPrice = lowPrices[0];
            lowPrices.forEach(obj => {
                if (obj.price < lowPrice.price && obj.seatCount > 0) {
                    lowPrice = obj;
                }
            })
            item.seatLowest = {
                ...lowPrice
            }
        }
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
        const { oldModel, oldModelDetail,DepartureDateTime } = this.params;
        const { feeType ,compReferenceEmployee} = this.props;
        // let compReferenceEmployeeId = compReferenceEmployee&&compReferenceEmployee.PassengerOrigin&&compReferenceEmployee.PassengerOrigin.EmployeeId
        let model = {
            OrderId: oldModel && oldModel.Id,
            DepartureDate: DepartureDateTime.format('yyyy-MM-dd', true),
            RulesTravelId:compReferenceEmployee&&compReferenceEmployee.RulesTravelId
        }
        let lowPricePromise  = FlightService.GetReissueQuery(model);
        if (this.state.currentBusinessType === 1) {
            this.showLoadingView();
        }
        let rescheduleCharge = 0;
        if(oldModelDetail?.OrderAir?.PolicySummary?.ReissuePolicy){
            let lists = oldModelDetail.OrderAir.PolicySummary.ReissuePolicy.Details;
            let currentDate = new Date();
            if(Array.isArray(lists)){
                try {
                    lists.forEach(detailFee => {
                        if(detailFee){
                            let rulesData = new Date(detailFee.Timeline);
                            if (isNaN(rulesData)) return; // 跳过无效日期
                            if((Date.parse(currentDate) <= Date.parse(rulesData) && detailFee.TimelineType == 1) || (Date.parse(currentDate) >= Date.parse(rulesData) && detailFee.TimelineType == 3)){
                                rescheduleCharge = detailFee.Fee
                            }
                        }
                    })
                }catch(error){
                }
            }
        }
        lowPricePromise.then(response => {
            if (this.state.currentBusinessType === 1) {
                this.hideLoadingView();
            }
            if (response && response.success) {
                if (!response.data || response.data.length === 0) {
                    this.setState({
                        showErrorMessage: '没有符合条件的航班了'
                    })
                    return;
                }
                let sectionList = [];

                response.data.forEach((obj, index) => {
                    if (obj.flightDisPlayInfo && Array.isArray(obj.flightDisPlayInfo) && obj.flightDisPlayInfo.length > 0) {
                        let playInfo = obj.flightDisPlayInfo[0];
                            this.state.currentLowPrice = playInfo.Price;
                            obj.Price = Number(((playInfo?.Price || 0) - (oldModelDetail?.OrderAir?.Price || 0)).toFixed(2)) || 0;
                            //C，改期税=改稅-原肮班税
                            obj.YqTax -= oldModelDetail.YaTax;
                            obj.CnTax -= oldModelDetail.CnTax;
                            obj.Tax -= oldModelDetail.Tax;
                        sectionList.push({ lowPrice: obj.flightDisPlayInfo, isOpen: false, data: [...obj.flightDisPlayInfo],PriceCha:obj.Price });
                    }
                })
                if (this.state.isFilter) {
                    this._filterCanbin(sectionList);
                    return;
                }
                this.setState({
                    showErrorMessage: '',
                    recordSection: [].concat(sectionList),
                    sectionLists: sectionList
                }, () => {
                    StorageUtil.saveKeyId(Key.FLightListChangeStopTime,new Date().format('yyyy-MM-dd HH:mm:ss'));
                    // if (this.state.bottomBtnIndex === 1) {
                    this._bottomSelectClick(this.state.bottomBtnIndex);
                    // }
                })
            }else if(response.code=='TRR-2003-14'){
                this.showAlertView(response.message, () => {
                    return ViewUtil.getAlertButton('确定', () => {
                        this.dismissAlertView();
                    })
                });
            }else {
                this.toastMsg('没有符合条件的航班了');
                this.setState({
                    showErrorMessage:'没有符合条件的航班了'
                })
            }
        }).catch(error => {
            if (this.state.currentBusinessType === 1) {
                this.hideLoadingView();
            }
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
        const { ArrivalCityName , DepartureCityName , DepartureDateTime } = this.params;

        let obj = section.lowPrice[section.lowPrice.length - 1];
        obj.fltInfo.cabinClassJson = obj.cabinClassInfo;
        let model = {
            AirCode: obj.AirCode,
            ArrivalAirport: obj.ArrivalAirport,
            ArrivalCityName: ArrivalCityName,
            ArrivalCityCode: obj.ArrivalCityCode,
            DepartureAirport: obj.DepartureAirport,
            DepartureCityName: DepartureCityName,
            DepartureDateTime: DepartureDateTime.format('yyyy-MM-dd', true),
            DepartureCityCode: obj.DepartureCityCode,
            IsDirect: false,
            JourneyType: 'OW',
            LowestOrAll: 'A',
            MoreFlightJson: JSON.stringify([obj.fltInfo]),
            cabinClassJson: JSON.stringify(obj.cabinClassInfo),
            SupplierType: obj.SupplierType,
            SegHeadId: obj.ProductId,
            DataId: obj.DataId,
            FeeType: this.props.feeType
        }
            model.IsReissue = true;
        this.push('FlightChangeMore', { request: model, ...this.params, section: section ,feeType:this.props.feeType,moreData:section.data});
    }
    /**
     *  加载更多数据之前，进行日期数据比较
     */

    _judgeIsLoadLow = (section) => {
        StorageUtil.loadKeyId(Key.FLightListChangeStopTime).then(response => {
            if (response && (new Date().getTime() - Util.Date.toDate(response).getTime() >= 10 * 60 * 1000)) {
                this.showAlertView('终于回来了，航班可能有变化，将为您重新查询', () => {
                    return ViewUtil.getAlertButton('取消', () => {
                        this.dismissAlertView();
                        this.pop();

                    }, '确定', () => {
                        StorageUtil.saveKeyId(Key.FLightListChangeStopTime,new Date().format('yyyy-MM-dd HH:mm:ss'));
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
  
    // 切换业务

    _checkBusineesType = (index) => {
        this.setState({
            currentBusinessType: index
        })
    }

    /**
     *  修改日期 index=1是减 =2加
     */
    _changeDate = (index) => {
        if (index === 1) {
            let today = new Date();
                if (today.format('yyyy-MM-dd') === this.params.DepartureDateTime.format('yyyy-MM-dd')) {
                    this.toastMsg('所选时间不能小于当前时间');
                    return;
                }
                this.params.DepartureDateTime = this.params.DepartureDateTime.addDays(-1);
        } else {
                this.params.DepartureDateTime = this.params.DepartureDateTime.addDays(1);
        }
        this.setState({ sectionLists: [], 
            showErrorMessage: '', 
            trainList: [], 
            trainLowTrip: null, 
            currentLowPrice: 0 
        }, () => {
            this._loadLowPrice();
            this._loadTrainLowPriceList();
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
                            isShare,
                            isFilter
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
                    isShare: this.state.isShare
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

    // 预定最低价格火车票
    _toLowOrderTrain = () => {
        const { goCityData, arrivalCityData } = this.params;
        const { trainLowTrip, } = this.state;
        if(!trainLowTrip){return}
        trainLowTrip.ticketTypes = [trainLowTrip.seatLowest];
        trainLowTrip.SearchFromCity = {
            fromCityName: goCityData.Name,
            fromCityCode: goCityData.Name
        }
        trainLowTrip.SearchToCity = {
            toCityName: arrivalCityData.Name,
            toCityCode: arrivalCityData.Name
        }
        this.push('TrainTicketScreen', {
            ticket: trainLowTrip,
            reissueOrder: null,
            departureDate: this.params.goDate,
            feeType: this.props.feeType
        })
    }



    _renderHeaderDateSelect = () => {
        const {  DepartureDateTime } = this.params;
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
                        text={ DepartureDateTime.format('yyyy-MM-dd') + ' ' + DepartureDateTime.getWeek()}
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
            isChange={true} 
            lowThis={this} 
            oldModel ={this.state.oldModel} 
            oldPolicySummary={this.state.oldPolicySummary} 
            currentLowPrice={this.state.currentLowPrice} 
            loadMorePrice={this._judgeIsLoadLow.bind(this, section)} 
        />
    }
    _renderItem = (item) => {
        return null;
        // return <MorePriceView priceObj={item}  {...this.params} feeType={this.props.feeType} moreThis={this} orderBtnClick={this._orderBtnClick.bind(this, item.item)} />
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
                        </View>
                }
            </View>
        )
    }

    renderBody() {
        const { sectionLists, showErrorMessage, trainList } = this.state;
        return (
            <View style={{ flex: 1 }}>
                {this._renderHeaderDateSelect()}
                {
                    this.state.currentBusinessType === 1 ?
                        <View style={{ flex: 1 }}>

                            {
                                sectionLists.length === 0 && (showErrorMessage || this.state.isFilter) ?
                                    this._renderError()
                                    :
                                    <SectionList
                                        sections={sectionLists}
                                        renderSectionHeader={this._renderSectionHeader}
                                        renderItem={this._renderItem}
                                        keyExtractor={(item, idnex) => String(idnex)}
                                        initialNumToRender={8}
                                    />
                            }
                            {this._renderBottomFilter()}
                        </View>
                        : <View style={{ flex: 1 }}>
                            <FlatList
                                style={{ flex: 1 }}
                                data={trainList}
                                renderItem={this._renderTrainItem}
                                showsVerticalScrollIndicator={false}
                                keyExtractor={(item, index) => String(index)}
                            />
                            {this._renderTrainBottom()}
                        </View>
                }

            </View>
        )
    }



    /**
   * 行内容
   */
    _renderTrainItem = ({ item }) => {
        return (
            <LisItemView item={item} callBack={this._trainNextStation} filterOptions={this.state.trainFilterOptions} />
        )
    }
    _renderTrainBottom = () => {
        let array = ['出发', '到达', '耗时', '筛选'];
        const { trainBottomIndex, isTrainFilter } = this.state;
        return (
            <View style={{ backgroundColor: "white", height: 50, flexDirection: 'row' }}>
                {
                    array.map((item, index) => {
                        return (
                            <TouchableOpacity key={index}  onPress={this._renderTrainBottomFilter.bind(this, index)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' ,flexDirection:'row'}}>
                                <CustomText text={item} style={{ color: trainBottomIndex === index || (isTrainFilter && index === array.length - 1) ? Theme.theme : Theme.darkColor }} />
                                <Text style={{ color: trainBottomIndex === index || (isTrainFilter && index === array.length - 1) ? Theme.theme : Theme.darkColor }}>{index ===3?'':'↓'}</Text>
                            </TouchableOpacity>
                        )
                    })
                }
            </View>
        )
    }
    /**
    *  筛选
    */
    _renderTrainBottomFilter = (index) => {
        let departureDate = this.params.goDate;
        switch (index) {
            case 0:
                this.state.trainList.sort((a, b) => {
                    let aDep = Util.Date.toDate(`${departureDate.format('yyyy-MM-dd', true)} ${a.start_time}`);
                    let bDep = Util.Date.toDate(`${departureDate.format('yyyy-MM-dd', true)} ${b.start_time}`);
                    return aDep - bDep;
                })
                break;

            case 1:
                this.state.trainList.sort((a, b) => {
                    let aDiff = departureDate.addDays(+a.arrive_days);
                    let bDiff = departureDate.addDays(+b.arrive_days);
                    let aDep = Util.Date.toDate(`${aDiff.format('yyyy-MM-dd', true)} ${a.arrive_time}`);
                    let bDep = Util.Date.toDate(`${bDiff.format('yyyy-MM-dd', true)} ${b.arrive_time}`);
                    return aDep - bDep;
                })
                break;
            case 2:
                this.state.trainList.sort((a, b) => {
                    return parseInt(a.run_time_minute) - parseInt(b.run_time_minute);
                })
                break;
            case 3:
                this.push('TrainFilterScreen', {
                    callBack: (isFilter, filterOptions) => {
                        this.setState({
                            isTrainFilter: isFilter,
                            trainFilterOptions: filterOptions
                        })
                    },
                    list: this.state.trainList,
                    filterOptions: this.state.trainFilterOptions
                });
                return;
        }

        this.setState({
            trainBottomIndex: index
        })
    }

    /**
     *  
     */
    _trainNextStation = (item) => {
        const { goCityData, arrivalCityData, goDate } = this.params
        item.SearchFromCity = {
            fromCityName: goCityData.Name,
            fromCityCode: goCityData.Name,
        }
        item.SearchToCity = {
            toCityName: arrivalCityData.Name,
            toCityCode: arrivalCityData.Name
        }
        let hasSeat = item.ticketTypes.some(ticket => ticket.seatCount > 0);
        if (hasSeat && item.can_buy_now === 'Y') {
            this.push('TrainTicketScreen', {
                ticket: item,
                reissueOrder: this.params.reissueOrder,
                departureDate: goDate,
                feeType: this.props.feeType
            })
        } else {
            if(item.can_buy_now==='N'){
                this.toastMsg('该车次车票未开售');
            }else{
                this.toastMsg('该车次车票已售完');
            }
        }
    }
}

const getPropsState = state => ({
    feeType: state.feeType.feeType,
    // compReferenceEmployee: state.compReferenceEmployee.ReferenceEmployee//综合订单出差人选定参考出差人信息
})

export default connect(getPropsState)(FlightChangeListScreen);

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
        height: 50,
        backgroundColor: 'white',
        flexDirection: 'row'
    },
    bottom_touch: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    alertStyle:{
        width: '80%', 
        backgroundColor:'#fff',
        borderRadius:8,
        padding:10,
    },
})