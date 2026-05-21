import React from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Text,
    TouchableOpacity,
    TouchableHighlight,
} from 'react-native';
import SuperView from '../../super/SuperView';
import CheckBox from '../../custom/CheckBox';
import InflFlightService from '../../service/InflFlightService';
import CustomText from '../../custom/CustomText';
import ViewUtil from '../../util/ViewUtil';
import Theme from '../../res/styles/Theme';
import Util from '../../util/Util';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Key from '../../res/styles/Key';
import StorageUtil from '../../util/StorageUtil';

/**
 * 国际机票机票筛选页
 */
export default class FilterScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '筛选',
            // rightButton: ViewUtil.getRightButton('恢复默认', () => this.setState({ selectedAirCompany: ['不限'], selectedFromAirport: '不限', selectedToAirport: '不限', selectedFromTime: '不限', selectedToTime: '不限', isDirect: false, selectedTransformCity: ['不限'], selectedCabin: ['不限'] }))
        }


        const { list, filter, queryModel, query, options } = this.params;
        this.defalutOptions = Util.Encryption.clone(options);
        this.filter = filter;
        this.queryModel = queryModel;
        this.query = query;
        if (list && list.length > 0) {
            if (list[0].OWFlights) {
                this.departure = list[0].OWFlights.departurnName;
            }
            if (list[0].OWFlights) {
                this.destination = list[0].OWFlights.arrivalName;
            }
        }
        this.state = {
            /**
             * 所有结果列表
             */
            allList: list,
            /**
             * 直飞最低价列表
             */
            allDirectfilterList:[],
            /**
             * 当前选项
             */
            curOption: options.curOption || filterOptions.takeOffTime,
            /**
             * 是否直达
             */
            isDirect: options.isDirect,
            /**
             * 已选起飞时间
             */
            selectedFromTime: options.fromTime,
            /**
             * 已选抵达时间
             */
            selectedToTime: options.toTime,
            /**
             * 已选起飞机场
             */
            selectedFromAirport: options.fromAirport,
            /**
             * 已选抵达机场
             */
            selectedToAirport: options.toAirport,
            /**
             * 已选航司
             */
            selectedAirCompany: options.airCompany,
            /**
             * 已选航司code
             */
            selectedAirCompanyCode: options.airCompanyCode,
            /**
             * 已选中转城市
             */
            selectedTransformCity: options.transformCity,
            /**
             * 已选舱位
             */
            selectedCabin: options.cabin,
            /**
             * 已选机型
             */
            selectedFlightType: options.flightType,

            isShare:options.isShare,//是否共享
            craftTypeList:[],
        };
    }

    componentDidMount() {
        StorageUtil.loadKey(Key.CraftTypeList).then(result => {
            this.setState({
                craftTypeList: result || []
            })
        })
    }


    _isAddTime = (selectedTime, curTime) => {
        if (selectedTime === '不限') {
            return true;
        } else {
            let isAdd = false;
            if (curTime instanceof Date) {
                var hours = curTime.getHours();
                switch (selectedTime) {
                    case '00:00 - 06:00': if (hours >= 0 && hours < 6) {
                        isAdd = true;
                    } break;
                    case '06:00 - 12:00': if (hours >= 6 && hours < 12) {
                        isAdd = true;
                    } break;
                    case '12:00 - 18:00': if (hours >= 12 && hours < 18) {
                        isAdd = true;
                    } break;
                    case '18:00 - 24:00': if (hours >= 18 && hours < 24) {
                        isAdd = true;
                    } break;
                }
            }
            return isAdd;
        }
    }

    _filterProcess = () => {
        const { selectedAirCompany, 
                selectedFromTime,
                selectedFlightType, 
                selectedToTime, 
                selectedAirCompanyCode, 
                selectedFromAirport, 
                selectedCabin, 
                selectedToAirport, 
                selectedTransformCity, 
                isDirect, 
                allList, 
                curOption,
                allDirectfilterList,
                isShare,
                craftTypeList
        } = this.state;
        let list = [];
        for (let item of allList) {
            let depFlight = null;
            let arrFlight = null;
            if (item.OWFlights && item.OWFlights.FlightSegments.length > 0) {
                depFlight = item.OWFlights.FlightSegments[0];
                arrFlight = item.OWFlights.FlightSegments[item.OWFlights.FlightSegments.length - 1];
            }
            if (!depFlight || !arrFlight) {
                continue;
            }
            let addFromTime = false;
            let addToTime = false;
            let addFromAirport = false;
            let addToAirport = false;
            let addTransformCity = false;
            let addFlightType = false;
            let addNoShare = false;
            let addAirCompany = false;
            //起飞时间
            if (selectedFromTime === '不限') {
                addFromTime = true;
            } else {
                let departureTime = Util.Date.toDate(depFlight.DepartureTime);
                addFromTime = this._isAddTime(selectedFromTime, departureTime);
            }
            //降落时间
            if (selectedToTime === '不限') {
                addToTime = true;
            } else {
                let arrivalTime = Util.Date.toDate(arrFlight.ArrivalTime);
                addToTime = this._isAddTime(selectedToTime, arrivalTime);
            }
            //起飞机场
            if (selectedFromAirport === '不限') {
                addFromAirport = true;
            } else {
                if (depFlight.DepartureAirportName === selectedFromAirport) {
                    addFromAirport = true;
                }
            }
            //降落机场
            if (selectedToAirport === '不限') {
                addToAirport = true;
            } else {
                if (arrFlight.ArrivalAirportName === selectedToAirport) {
                    addToAirport = true;
                }
            }
            // 机型大小
            let planType = Util.Read.planType2(depFlight.Equipment,craftTypeList);
            if (selectedFlightType === '不限'||selectedFlightType === planType) {
                addFlightType = true;
            }else if(selectedFlightType === '其他机型'){
                if(!(planType === '大型' || planType === '中型' )){
                    addFlightType = true;
                }
            }

            // 是否共享
            if (!isShare) {
                if (!depFlight.ShareAirlineCode || depFlight.ShareAirlineCode === null || depFlight.ShareAirlineCode === undefined) {
                    addNoShare = true;
                }
            }else{
                addNoShare = true;
            }

            if (Array.isArray(selectedTransformCity) && selectedTransformCity.length > 0) {
                if (selectedTransformCity[0] === '不限') {
                    addTransformCity = true;
                } else {
                    if (item.OWFlights.FlightSegments && item.OWFlights.FlightSegments.length > 1) {
                        let flight = item.OWFlights.FlightSegments[0];
                        if (selectedTransformCity&&selectedTransformCity.includes(flight.ArrivalCityName)) {
                            addTransformCity = true;
                        }
                    }
                }
            }
            //筛选航司
            if (Array.isArray(selectedAirCompanyCode) && selectedAirCompanyCode.length > 0) {
                if (selectedAirCompanyCode[0] === '不限') {
                    addAirCompany = true;
                }else{
                    if (item.OWFlights.FlightSegments && item.OWFlights.FlightSegments.length > 0) {
                        item.OWFlights.FlightSegments.forEach(flight => {
                            if (selectedAirCompanyCode&&selectedAirCompanyCode.includes(flight.Airline)) {
                                addAirCompany = true;
                            }
                        })
                    }
                }
            }
            if (addFromTime && addToTime && addFromAirport && addToAirport && addTransformCity && addFlightType && addNoShare && addAirCompany) {
                list.push(item);
            }
        }
        this.pop();
        if (this.filter) {
            this.filter(
                list, 
                allDirectfilterList, {
                fromTime: selectedFromTime,
                toTime: selectedToTime,
                fromAirport: selectedFromAirport,
                toAirport: selectedToAirport,
                RtFromAirport: selectedToAirport ,
                RtToAirport: selectedFromAirport,
                airCompany: selectedAirCompany,
                airCompanyCode: selectedAirCompanyCode,
                transformCity: selectedTransformCity,
                cabin: selectedCabin,
                flightType: selectedFlightType,
                isDirect: isDirect,
                curOption: curOption,
                isShare:isShare,
            });
        }
    }
    _filter = () => {
        const { isDirect, selectedCabin, selectedAirCompany, selectedAirCompanyCode } = this.state;
        const {RtFilter} = this.params//RtFilter是否是返程筛选
        // if (isDirect || selectedCabin[0] != '不限' || selectedAirCompany[0] !='不限') {
        let isCabEqual = JSON.stringify(selectedCabin) === JSON.stringify(this.defalutOptions.cabin);
        // let isAirEqual = JSON.stringify(selectedAirCompany) === JSON.stringify(this.defalutOptions.airCompany);
        // if (isDirect !== this.defalutOptions.isDirect || !isCabEqual || !isAirEqual) {
        if ((isDirect == true || isDirect !== this.defalutOptions.isDirect || !isCabEqual) && !RtFilter ) {
            this.queryModel.IsOnlyDirect = isDirect;
            let PhysicalCabins = [];
            for (const item of selectedCabin) {
                if (item === '不限'||item === "") {
                    break;
                } else if (item === '头等舱') {
                    PhysicalCabins.push('FIRST');
                } else if (item === '超值经济舱') {
                    PhysicalCabins.push('PREMIUM_ECONOMY');
                } else if (item === '公务舱') {
                    PhysicalCabins.push('BUSINESS');
                } else {
                    PhysicalCabins.push('ECONOMY');
                }
            }
            if (PhysicalCabins.length > 0) {
                this.queryModel.PhysicalCabins = PhysicalCabins;
            } else {
                delete this.queryModel.PhysicalCabins;
            }
            // if (selectedAirCompany.length > 0 && selectedAirCompany[0] !== '不限') {
            //     this.queryModel.Airlines = selectedAirCompanyCode;
            // } else {
            //     delete this.queryModel.Airlines;
            // }
            this.showLoadingView();
            InflFlightService.getIntlFlightQuery(this.queryModel).then(result => {
                this.hideLoadingView();
                if (result&& Array.isArray(result)) {
                    let flightList = [];
                    result.forEach(flight => {
                        let journey = flight.Journeys && flight.Journeys[0];
                        flight.currentFlight = [journey];
                        if (journey) {
                            flight.Id = '';
                            journey.FlightSegments.forEach(segment => {
                                // flight.Id += segment.DepartureAirport + '_' + segment.ArrivalAirport + '_' + segment.Airline + '_' + segment.FlightNumber + '_' + segment.DepartureTime + '_' + segment.ArrivalTime;
                                flight.Id += segment.DepartureAirport + '_' + segment.ArrivalAirport + '_' + segment.Airline + '_' + segment.FlightNumber + '_' + segment.DepartureTime;
                            })
                            let index = flightList.findIndex(item => item.Id === flight.Id);
                            if (index === -1) {
                                flightList.push(flight);
                            }else{
                                if (journey.LowestPrice < flightList[index].LowestPrice) {
                                    flightList[index].LowestPrice = journey.LowestPrice;
                                }
                            }
                        }
                    });
                    this.setState({ 
                        showLoading: false, 
                        allList: flightList,
                        allDirectfilterList: result 
                    }, this._filterProcess); 
                }else {
                    this.setState({ showLoading: false });
                    this.toastMsg(result.message || '未查到直飞航班');
                }
            }).catch(error => {
                this.hideLoadingView();
                this.setState({ showLoading: false });
                this.toastMsg(error.message || '未查到直飞航班');
            })
        } else {
            this.hideLoadingView();
            this._filterProcess();
        }

    }


    renderBody() {
        const { isDirect, curOption, isShare } = this.state;
        const {showDirect} = this.params;
        return (
            <View style={{ flex: 1 }}>
               <View style={{ padding: 10, flexDirection: 'row', backgroundColor: '#fff', alignItems: 'center' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => this.setState({ isShare: !isShare })}>
                        <CheckBox
                            tintColor={Theme.promptFontColor}
                            isChecked={isShare}
                            onClick={() => this.setState({ isShare: !isShare })}
                        />
                        <CustomText style={{ marginRight: 5 }} text='共享航班' />
                    </TouchableOpacity>
                    {showDirect ?
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => this.setState({ isDirect: !isDirect })}>
                            <CheckBox
                                tintColor= {Theme.promptFontColor} 
                                isChecked={isDirect}
                                onClick={() => this.setState({ isDirect: !isDirect })}
                            />
                            <CustomText style={{ marginRight: 5 }} text='仅查看直飞' />
                        </TouchableOpacity>
                    :null}    
                </View> 
                <View style={{ flex: 1, flexDirection: 'row',borderTopWidth:1,borderColor:Theme.lineColor }}>
                    {this._renderLeft()}
                    {this._renderRight()}
                </View>
                {/* <TouchableHighlight style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.theme, height: 40, borderRadius: 3, position: 'absolute', bottom: 30, left: 10, right: 10 }} 
                                    onPress={this._filter} 
                                    activeOpacity={1} underlayColor='transparent'>
                    <CustomText style={{ color: 'white' }} text='确定' />
                </TouchableHighlight> */}
               {
                 ViewUtil.getTwoBottomBtn('清空',this._getCompList,'确定',this._filter)
               }
                
            </View>
        );
    }
    _getCompList = () => {
        this.setState({ selectedAirCompany: ['不限'], selectedFromAirport: '不限', selectedToAirport: '不限', selectedFromTime: '不限', selectedToTime: '不限', isDirect: false, selectedTransformCity: ['不限'], selectedCabin: ['不限'] })
    }
    

    _renderLeft = () => {
        const { curOption } = this.state;
        const {RtFilter} = this.params;
        let tabs = [{
            name: '起飞时间',
            value: filterOptions.takeOffTime
        }, {
            name: '机场',
            value: filterOptions.airport
        }, {
            name: '航空公司',
            value: filterOptions.airCompany
        }, 
        {
            name: '舱位',
            value: filterOptions.cabin
        }, 
        {
            name: '机型',
            value: filterOptions.flightType
        }, {
            name: '中转城市',
            value: filterOptions.transformCity
        }];
        if(RtFilter){//返程筛选去掉舱位筛选
            tabs=tabs.filter(item=>item.value!==filterOptions.cabin)
            if(curOption === filterOptions.cabin){
                this.setState({ curOption: filterOptions.takeOffTime })   
            }
        }
        return (
            <View style={{ flex: 3, backgroundColor: '#f1f1f1' }}>
                {
                    tabs.map((item, index) => (
                        <TouchableHighlight
                            key={index}
                            underlayColor='transparent'
                            onPress={() => {
                                if (curOption !== item.value) {
                                    this.setState({ curOption: item.value })
                                }
                            }}>
                            <View style={[curStyle.leftTab, curOption === item.value ? curStyle.leftTabActive : curStyle.leftTabNormal]}>
                                <View style={{ height: 50, width: 3, backgroundColor: curOption === item.value ?Theme.theme:Theme.normalBg }}></View>
                                <CustomText style={{ color: curOption === item.value ? '#333' : '#999' }} text={item.name} />
                                <View style={{ height: 50, width: 5 }}></View>
                            </View>
                        </TouchableHighlight>
                    ))
                }
                <View style={{ flex: 1,  }}>
                </View>
            </View>
        );
    }

    _renderRight = () => {
        const { curOption } = this.state;
        const {RtFilter} = this.params;
        if (curOption === filterOptions.takeOffTime) {
            return this._renderTakeOffTime();
        } else if (curOption === filterOptions.airport) {
            return this._renderAirport();
        } else if (curOption === filterOptions.airCompany) {
            return this._renderAirCompany();
        } 
        else if (curOption === filterOptions.cabin && RtFilter) {
            return this._renderTakeOffTime();
        } 
        else if (curOption === filterOptions.cabin && !RtFilter) {
            return this._renderCabin();
        } 
        else if (curOption === filterOptions.transformCity) {
            return this._renderTransformCity();
        } else if (curOption === filterOptions.flightType) {
            return this._renderFlightType();
        } else {
            return null;
        }
    }

    /**
     * 渲染起飞时间
     */
    _renderTakeOffTime = () => {
        const { selectedFromTime, selectedToTime } = this.state;
        let timeOptions = ['不限', '00:00 - 06:00', '06:00 - 12:00', '12:00 - 18:00', '18:00 - 24:00'];
        return (
            <View style={{ flex: 7, backgroundColor: 'white' }}>
                <ScrollView style={{ flex: 1, marginBottom: 80 }} keyboardShouldPersistTaps='handled'>
                    <View style={{ backgroundColor: Theme.normalBg, paddingHorizontal: 10, paddingVertical: 5 }}>
                        <CustomText text='起飞时段' />
                    </View>
                    {
                        timeOptions.map((item, index) => (
                            <TouchableHighlight key={index} underlayColor='transparent' onPress={() => this.setState({ selectedFromTime: item })}>
                                <View key={index} style={[curStyle.rightTab, index === 0 ? null : curStyle.rightTabActive]}>
                                    <CustomText style={{ color: selectedFromTime === item ? Theme.theme : '#666' }} text={item} />
                                    {
                                        selectedFromTime === item ? (
                                            <MaterialIcons
                                                name={"check-box"}
                                                size={18}
                                                color={Theme.theme}
                                            />
                                        ) : null
                                    }
                                </View>
                            </TouchableHighlight>
                        ))
                    }
                    <View style={{ backgroundColor: Theme.normalBg, paddingHorizontal: 10, paddingVertical: 5 }}>
                        <CustomText text='抵达时段' />
                    </View>
                    {
                        timeOptions.map((item, index) => (
                            <TouchableHighlight key={index} underlayColor='transparent' onPress={() => this.setState({ selectedToTime: item })}>
                                <View key={index} style={[curStyle.rightTab, index === 0 ? null : curStyle.rightTabActive]}>
                                    <CustomText style={{ color: selectedToTime === item ? Theme.theme : '#666' }} text={item} />
                                    {
                                        selectedToTime === item ? (
                                            <MaterialIcons
                                                name={"check-box"}
                                                size={18}
                                                color={Theme.theme}
                                            />
                                        ) : null
                                    }
                                </View>
                            </TouchableHighlight>
                        ))
                    }
                </ScrollView>
            </View>
        );
    }
    /**
     * 渲染机型
     */
    _renderFlightType = () => {
        const { selectedFlightType } = this.state;
        if(!selectedFlightType){return}
        let typeOptions = ['不限', '大型', '中型', '其他机型'];
        return (
            <View style={{ flex: 7, backgroundColor: 'white' }}>
                <ScrollView style={{ flex: 1, marginBottom: 80 }} keyboardShouldPersistTaps='handled'>

                    {
                        typeOptions.map((item, index) => (
                            <TouchableHighlight key={index} underlayColor='transparent' onPress={() => this.setState({ selectedFlightType: item })}>
                                <View key={index} style={[curStyle.rightTab, index === 0 ? null : curStyle.rightTabActive]}>
                                    <CustomText style={{ color: selectedFlightType === item ?  Theme.theme : '#666' }} text={item} />
                                    {
                                        selectedFlightType === item ? (
                                            <MaterialIcons
                                                name={"check-box"}
                                                size={18}
                                                color={Theme.theme}
                                            />
                                        ) : null
                                    }
                                </View>
                            </TouchableHighlight>
                        ))
                    }
                </ScrollView>
            </View>
        );
    }
    /**
     * 渲染机场
     */
    _renderAirport = () => {
        const { selectedFromAirport, selectedToAirport, allList } = this.state;
        let fromtList = ['不限'];
        let fromCodeList = ['不限'];
        let toList = ['不限'];
        let toCodeList = ['不限'];
        if(!allList){return}
        allList.forEach(item => {
            if (item.OWFlights && item.OWFlights.FlightSegments.length > 0) {
                let list = item.OWFlights.FlightSegments;
                if (list[0].DepartureAirportName && fromtList.indexOf(list[0].DepartureAirportName) === -1) {
                    fromtList.push(list[0].DepartureAirportName);
                    fromCodeList.push(list[0].DepartureAirportEnName);
                }
                if (list[list.length - 1].ArrivalAirportName && toList.indexOf(list[list.length - 1].ArrivalAirportName) === -1) {
                    toList.push(list[list.length - 1].ArrivalAirportName);
                    toCodeList.push(list[list.length - 1].ArrivalAirportEnName);
                }
            }
        });
        return (
            <View style={{ flex: 7, backgroundColor: 'white' }}>
                <ScrollView style={{ flex: 1, marginBottom: 80 }} keyboardShouldPersistTaps='handled'>
                    <View style={{ backgroundColor: Theme.normalBg, paddingHorizontal: 10, paddingVertical: 5 }}>
                        <CustomText text={this.departure} />
                    </View>
                    {
                        fromtList.length>0 && fromtList.map((item, index) => (
                            <TouchableHighlight key={index} underlayColor='transparent' onPress={() => this.setState({ selectedFromAirport: item })}>
                                <View key={index} style={[curStyle.rightTab, index === 0 ? null : curStyle.rightTabActive]}>
                                    <CustomText style={{ color: selectedFromAirport === item ?  Theme.theme : '#666' }} text={Util.Parse.isChinese() ? item : fromCodeList[index]} />
                                    {
                                        selectedFromAirport === item ? (
                                            <MaterialIcons
                                                name={"check-box"}
                                                size={18}
                                                color={Theme.theme}
                                            />
                                        ) : null
                                    }
                                </View>
                            </TouchableHighlight>
                        ))
                    }
                    <View style={{ backgroundColor: Theme.normalBg, paddingHorizontal: 10, paddingVertical: 5 }}>
                        <CustomText text={this.destination} />
                    </View>
                    {
                        toList.map((item, index) => (
                            <TouchableHighlight key={index} underlayColor='transparent' onPress={() => this.setState({ selectedToAirport: item })}>
                                <View key={index} style={[curStyle.rightTab, index === 0 ? null : curStyle.rightTabActive]}>
                                    <CustomText style={{ color: selectedToAirport === item ?  Theme.theme : '#666' }} text={Util.Parse.isChinese() ? item : toCodeList[index]} />
                                    {
                                        selectedToAirport === item ? (
                                            <MaterialIcons
                                                name={"check-box"}
                                                size={18}
                                                color={Theme.theme}
                                            />
                                        ) : null
                                    }
                                </View>
                            </TouchableHighlight>
                        ))
                    }
                </ScrollView>
            </View>
        );
    }
    /**
     * 渲染航司
     */
    _renderAirCompany = () => {
        let { selectedAirCompany, allList, selectedAirCompanyCode } = this.state;
        if(!selectedAirCompany){return}
        let companyList = ['不限'];
        let companyCodeList = ['不限'];
        if(!allList){return}
        allList.forEach(item => {
            if (item.OWFlights && item.OWFlights.FlightSegments.length > 0) {
                item.OWFlights.FlightSegments.forEach(flight => {
                    if (companyList.indexOf(flight.AirlineName) === -1) {
                        companyList.push(flight.AirlineName);
                        companyCodeList.push(flight.Airline);
                    }
                });
            }
        });
        return (
            <View style={{ flex: 7, backgroundColor: 'white' }}>
                <ScrollView style={{ flex: 1, marginBottom: 80 }} keyboardShouldPersistTaps='handled'>
                    {
                        companyList.map((item, index) => {
                            let curIndex = selectedAirCompany.indexOf(item);
                            let selectPress = () => {
                                if (curIndex === -1) {
                                    if (item === '不限') {
                                        selectedAirCompany = ['不限'];
                                        selectedAirCompanyCode = ['不限'];
                                    } else {
                                        let bxIndex = selectedAirCompany.indexOf('不限');
                                        if (bxIndex !== -1) {
                                            selectedAirCompany.splice(bxIndex, 1);
                                            selectedAirCompanyCode.splice(bxIndex, 1);
                                        }
                                        selectedAirCompany.push(item);
                                        selectedAirCompanyCode.push(companyCodeList[index]);
                                    }
                                } else {
                                    selectedAirCompany.splice(curIndex, 1);
                                    if (selectedAirCompany.length === 0) {
                                        selectedAirCompany.push('不限');
                                    }
                                    selectedAirCompanyCode.splice(curIndex, 1);
                                }
                                this.setState({ selectedAirCompany, selectedAirCompanyCode });
                            }
                            return (
                                <TouchableHighlight key={index} underlayColor='transparent' onPress={selectPress}>
                                    <View key={index} style={[curStyle.rightTab, index === 0 ? null : curStyle.rightTabActive]}>
                                        <CustomText style={{ color: curIndex !== -1 ?  Theme.theme : '#666' }} text={Util.Parse.isChinese() ? item : companyCodeList[index]} />
                                        <CheckBox
                                            imgStyle={{ tintColor: curIndex !== -1 ?  Theme.theme : '#666' }}
                                            isChecked={curIndex !== -1}
                                            onClick={selectPress}
                                        />
                                    </View>
                                </TouchableHighlight>
                            );
                        })
                    }
                </ScrollView>
            </View >
        );
    }

    /**
     * 渲染舱位
     */
    _renderCabin = () => {
        let { selectedCabin } = this.state;
        const { canbinOption } = this.params;
        selectedCabin = selectedCabin.filter(item => item !== '');
        if(!selectedCabin){return};
        let cabin =canbinOption ? canbinOption: ['不限', '经济舱', '超值经济舱', '公务舱', '头等舱'];
        return (
            <View style={{ flex: 7, backgroundColor: 'white' }}>
                <ScrollView style={{ flex: 1, marginBottom: 80 }} keyboardShouldPersistTaps='handled'>
                    {
                        cabin.map((item, index) => {
                            let curIndex = selectedCabin.indexOf(item);
                            let selectPress = () => {
                                if (curIndex === -1) {
                                    if (item === '不限') {
                                        selectedCabin = ['不限'];
                                    } else {
                                        let bxIndex = selectedCabin.indexOf('不限');
                                        if (bxIndex !== -1) {
                                            selectedCabin.splice(bxIndex, 1);
                                        }
                                        selectedCabin.push(item);
                                    }
                                } else {
                                    selectedCabin.splice(curIndex, 1);
                                    if (selectedCabin.length === 0) {
                                        selectedCabin.push('不限');
                                    }
                                }
                                this.setState({ selectedCabin });
                            }
                            return (
                                <TouchableHighlight key={index} underlayColor='transparent' onPress={selectPress}>
                                    <View key={index} style={[curStyle.rightTab, index === 0 ? null : curStyle.rightTabActive]}>
                                        <CustomText style={{ color: curIndex !== -1 ?  Theme.theme : '#666' }} text={item} />
                                        <CheckBox
                                            imgStyle={{ tintColor: curIndex !== -1 ?  Theme.theme : '#666' }}
                                            isChecked={curIndex !== -1}
                                            onClick={selectPress}
                                        />
                                    </View>
                                </TouchableHighlight>
                            );
                        })
                    }
                </ScrollView>
            </View>
        );
    }

    /**
     * 渲染中转城市
     */
    _renderTransformCity = () => {
        let { selectedTransformCity, allList } = this.state;
        if(!allList || !selectedTransformCity){return}
        let transformCity = ['不限'];
        let transformEcity = ['不限'];
        allList.forEach(item => {
            if (item.OWFlights && item.OWFlights.FlightSegments.length > 1) {
                let flight = item.OWFlights.FlightSegments[0];
                if (transformCity.indexOf(flight.ArrivalCityName) === -1) {
                    transformCity.push(flight.ArrivalCityName);
                    transformEcity.push(flight.ArrivalCityCode);
                }
            }

        });
        return (
            <View style={{ flex: 7, backgroundColor: 'white' }}>
                <ScrollView style={{ flex: 1, marginBottom: 80 }} keyboardShouldPersistTaps='handled'>
                    {
                        transformCity.map((item, index) => {
                            let curIndex = selectedTransformCity.indexOf(item);
                            let selectPress = () => {
                                if (curIndex === -1) {
                                    if (item === '不限') {
                                        selectedTransformCity = ['不限'];
                                    } else {
                                        let bxIndex = selectedTransformCity.indexOf('不限');
                                        if (bxIndex !== -1) {
                                            selectedTransformCity.splice(bxIndex, 1);
                                        }
                                        selectedTransformCity.push(item);
                                    }
                                } else {
                                    selectedTransformCity.splice(curIndex, 1);
                                    if (selectedTransformCity.length === 0) {
                                        selectedTransformCity.push('不限');
                                    }
                                }
                                this.setState({ selectedTransformCity });
                            }
                            return (
                                <TouchableHighlight key={index} underlayColor='transparent' onPress={selectPress}>
                                    <View key={index} style={[curStyle.rightTab, index === 0 ? null : curStyle.rightTabActive]}>
                                        <CustomText style={{ color: curIndex !== -1 ? Theme.theme : '#666' }} text={Util.Parse.isChinese() ? item : transformEcity[index]} />
                                        <CheckBox
                                            imgStyle={{ tintColor: curIndex !== -1 ?  Theme.theme : '#666' }}
                                            isChecked={curIndex !== -1}
                                            onClick={selectPress}
                                        />
                                    </View>
                                </TouchableHighlight>
                            );
                        })
                    }
                </ScrollView>
            </View >
        );
    }
}

const curStyle = StyleSheet.create({
    leftTab: {
        height: 50,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor:Theme.normalBg,
        flexDirection: 'row',
    },
    leftTabActive: {
        backgroundColor: 'white'
    },
    leftTabNormal: {
        borderRightWidth: 1
    },
    rightTab: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginLeft: 10,
        paddingHorizontal: 10,
        height: 40
    },
    rightTabActive: {
        borderTopColor: Theme.normalBg,
        borderTopWidth: 1
    }
});

/**
 * 筛选项
 */
const filterOptions = {
    /**
     * 起飞时间
     */
    takeOffTime: 'takeOffTime',
    /**
     * 机场
     */
    airport: 'airport',
    /**
     * 航司
     */
    airCompany: 'airCompany',
    /**
     * 中转城市
     */
    transformCity: 'transformCity',
    /**
     * 舱位
     */
    cabin: 'cabin',
    /**
     * 机型
     */
    flightType: 'flightType'
}