import React from 'react';
import {
    View,
    Text,
    Image,
    FlatList,
    StyleSheet,
    TouchableHighlight,
    TouchableOpacity,
    Dimensions,
    Animated,
    ScrollView
} from 'react-native';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import I18nUtil from '../../util/I18nUtil';
import SearchInput from '../../custom/SearchInput';
import ViewUtil from '../../util/ViewUtil';
import HotelService from '../../service/HotelService';
import Theme from '../../res/styles/Theme';
import Util from '../../util/Util';
import StartView from './ListStartView';
import NetworkFaildView from '../../custom/NetWorkFaildView';
import CommonEnum from '../../enum/CommonEnum';
import CommonService from '../../service/CommonService';
import CustomeTextInput from '../../custom/CustomTextInput';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ListSortView from './ListSortView';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Pop from 'rn-global-modal';
import Foundation from 'react-native-vector-icons/Foundation';
import { connect } from 'react-redux';

class HotelListScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._tabBarBottomView = {
            bottomInset: true
        }
        const hotelFacilitiesImages = {
            'BREAKFAST': require('../../res/Uimage/hotelFloder/BREAKFAST.png'),
            'WIFI': require('../../res/Uimage/hotelFloder/WIFI.png'),
            'GYM': require('../../res/Uimage/hotelFloder/GYM.png'),
            'POOL': require('../../res/Uimage/hotelFloder/POOL.png'),
            'LAUNDRY': require('../../res/Uimage/hotelFloder/LAUNDRY.png'),
            'LUGGAGE': require('../../res/Uimage/hotelFloder/LUGGAGE.png'),
            'MEETING_ROOMS': require('../../res/Uimage/hotelFloder/MEETING_ROOMS.png'),
            'SHUTTLE': require('../../res/Uimage/hotelFloder/SHUTTLE.png'),
            'MORNING_CALL': require('../../res/Uimage/hotelFloder/MORNING_CALL.png'),
            'CONNECTING_ROOMS': require('../../res/Uimage/hotelFloder/CONNECTING_ROOMS.png'),
            // 添加更多设施图片映射
        };
        this.state = {
            isSelfSigned: false,
            hotelList: [],
            isLoding: true,
            isLoadingMore: false,
            isNoMoreData: false,
            page: 1,
            keyWord:this.params.locationId ? null :this.params.keyWord,
            _mykeyWord:this.params.keyWord,
            sort: this.params.currtentPosition ? 'distanc' : 'Default',
            options: Util.Parse.isChinese() ? SortCn : SortEn,
            lowPrice: '0',
            HeightPrice: '以上',
            selectStart: ['不限'],
            DistrictId: '',
            showErrorMessage: "",
            isShowSort: false,
            isShowStart: false,
            isShowDistance: false,
            isSHowFilter: false,
            // 符合差标
            MatchTravelRule: false,
            //  含早
            Breakfast: false,
            // 免费取消
            FreeCancel: false,
            // 立即确认
            InstantConfirmation: false,
            //协议酒店
            IsAgreement: false,
            //FCM特惠
            SelfOwnHotel: false,
            //行政区
            District: null,
            // 商圈
            Location: null,
            // 品牌
            Brand: null,
            // 距离
            Radius: 0,
            // 办公室地址
            Address: null,
            paymentArrival: false,//现付
            paymentAdvance: false,//预付
            IsCustomerAgreement: false,//协议酒店
            securetyTipViewY: new Animated.Value(global.screenHeight),
            cantonList: [],//行政区
            hideCantonList: [],//收起后的行政区
            showCanton: false,//是否收起

            businessList: [],//商圈
            hideBusinessList: [],//收起商圈
            showBusiness: false,//是否收起商圈

            airStationList: [],//机场、车票
            hideAitStationList: [],//收起机场、车票
            showAitStation: false,//是否收起机场、车票

            hospitalList: [],//医院
            hideHospitalList: [],//收起医院
            showHospital: false,//是否收起医院

            schoolList: [],//大学
            hideSchool: [],//收起大学
            showSchool: false,//是否收起大学

            cityScenicList: [],//室内景点
            hideCityScenic: [],//收起室内景点
            showCityScenic: false,//是否收起室内景点

            scenicspotsList: [],//室外景点
            hideScenicspots: [],//收起景点
            showScenicspots: false,//是否收起景点

            schoolList: [],//大学
            hideSchool: [],//收起大学
            showSchool: false,//是否收起大学

            performList: [],//演出场馆
            hidePerform: [],//收起演出场馆
            showPerform: false,//是否收起演出场馆

            shopList: [],//购物中心
            hideShopList: [],//购物中心
            showShopList: [],//购物中心: [],//购物中心

            key_word: null,
            dataList: [],
            locationId: this.params.locationId ? this.params.locationId :null,
            locationName:this.params.locationName ? this.params.locationName :null,
            IsRcPriceLimit:false,
            hotelFacilitiesImages: hotelFacilitiesImages,
            PoiQueryList:[],
            mapPoi:this.params.mapPoi ? this.params.mapPoi : null,
            UseMap:this.params.UseMap ? this.params.UseMap : false,
        }
        this._navigationHeaderView = {
            titleView: this._titleHeaderView(),
            // rightButton: ViewUtil.getRightButton('查看差标', this._getTravelRule)
            rightButton: <TouchableOpacity underlayColor='transparent' onPress={this._getTravelRule} style={{justifyContent:'center',alignItems:'center',paddingRight: Util.Parse.isChinese() ? 16 : 10}}>
                <Image style={{height:16,width:16}} source={require('../../res/Uimage/ruleIcon.png')}/>
                {/* <CustomText text={'差标'} style={{ fontSize: Util.Parse.isChinese() ? 12 : 11, color: Theme.fontColor }} /> */}
            </TouchableOpacity>
        }
    }
    //展示View
    _showTipView = () => {
        Animated.timing(
            this.state.securetyTipViewY,
            {
                toValue: -45,
                duration: 300,   //动画时长300毫秒
            }
        ).start();
    }
    //隐藏view
    _hiddenTipView = () => {
        Animated.timing(
            this.state.securetyTipViewY,
            {
                toValue: global.screenHeight,
                duration: 300, //动画时长300毫秒
            }).start();
    }
    /**
     * 搜索筛选抽屉
     */


    /**
     *  获取差旅标准
     */
    _getTravelRule = () => {
        const { city } = this.params;
        const { compReferenceEmployee } = this.props;
        let model = compReferenceEmployee? {
            Extra:{CityCode: city.Code},
            OrderCategory: CommonEnum.orderIdentification.hotel,
            RulesTravelId:compReferenceEmployee.RulesTravelId
        }:
        {
            OrderCategory: CommonEnum.orderIdentification.hotel,
        }
        this.showLoadingView();
        CommonService.GetTravelStandards(model).then(response => {
            this.hideLoadingView();
            if (response?.data?.RuleDesc?.length > 0) {
                Pop.show(
                    <View style={styles.alertStyle}>
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <CustomText text={'温馨提示'} style={{ margin: 6, fontSize: 18, fontWeight: 'bold' }} />
                        </View>
                        <View style={{ width: '100%' }}>
                            <CustomText text={response.data.OrderCategoryDesc} style={{ padding: 2, fontSize: 14, fontWeight: 'bold' }} />
                            {
                                // compReferenceEmployee && compReferenceEmployee.RulesTravelDetails ?
                                //     compReferenceEmployee.RulesTravelDetails.map((obj) => {
                                //         if (obj.Category === 4) {
                                //             return (
                                //                 obj.Rules.map((item, index) => {
                                //                     return (
                                //                         <View style={{ flexDirection: 'row', padding: 2 }} key={index}>
                                //                             {item.Value ? <CustomText text={item.Key + ': ' + item.Value} /> : null}
                                //                         </View>
                                //                     )
                                //                 })
                                //             )
                                //         }
                                //     })
                                //     :
                                    response.data.RuleDesc.map((item, index) => {
                                        return (
                                            <View style={{ flexDirection: 'row', padding: 2 }} key={index}>
                                                {item.Desc ? <CustomText text={item.Name + ': ' + item.Desc} /> : null}
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
                this.showAlertView('国内酒店:不限');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    _drawerClick = () => {
        this._showTipView()
        this._getKeyword()
    }
    //可选关键字UI
    _listView = (list) => {
        return (
            <View style={{ backgroundColor: '#fff', width: global.screenWidth, flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 }}>
                {
                    list.map((item, index) => {
                        return (
                            (index - 1) % 3 === 0 ?
                                <TouchableOpacity style={styles.boxStyle}
                                    onPress={() => {
                                        this.setState({
                                            keyWord: item.Name,
                                        }, () => {
                                            this._searchOrder();
                                        })
                                    }}
                                >
                                    <View style={{
                                        borderWidth: 0.5,
                                        borderColor: Theme.theme,
                                        borderRadius: 5,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 6
                                    }}>
                                        <CustomText text={item.Name}></CustomText>
                                    </View>
                                </TouchableOpacity>
                                :
                                <TouchableOpacity style={{
                                    borderWidth: 0.5,
                                    borderColor: Theme.theme,
                                    borderRadius: 5,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#fff',
                                    padding: 6,
                                    margin: 5
                                }}
                                    onPress={() => {
                                        this.setState({
                                            keyWord: item.Name,
                                        }, () => {
                                            this._searchOrder();
                                        })
                                    }}
                                >
                                    <CustomText text={item.Name}></CustomText>
                                </TouchableOpacity>
                        )
                    })
                }
            </View>
        )
    }
    /**
     * 获取地标、商圈、酒店名数据
     */
    _getKeyword = () => {
        // const {cantonList} = this.state;
        const { city } = this.params
        let array = [];
        let businessArr = [];
        let airStationArr = [];
        let hospitalArr = [];
        let schoolArr = [];
        let cityScenicArr = [];
        let scenicspotsArr = [];
        let performArr = [];
        let shopListArr = [];
        this.showLoadingView();
        const filtersPromise = HotelService.HotelCityFilters({ CityCode: city.Code });
        const brandPromise = HotelService.HotelBrand();
        Promise.all([filtersPromise, brandPromise]).then((result) => {
            this.hideLoadingView();
            if (result) {
                // resolve(response.json());
                let response = result[0];
                if (response && response.success) {
                    if (response.data) {
                        if (response.data.Locations) {
                            let locations = [];
                            response.data.Locations.forEach(obj => {
                                let atIndex = locations.findIndex(item => item.title === obj.Category);
                                if (atIndex > -1) {
                                    let location = locations[atIndex];
                                    location.data.push(obj);
                                } else {
                                    locations.push({ title: obj.Category, data: [obj] });
                                }
                            })
                            response.data.otwLocations = locations;
                        }

                        response.data.Districts.map((item) => {
                            array.push(item)
                        })
                        if (response.data.otwLocations) {
                            //商圈
                            if (response.data.otwLocations[0] && response.data.otwLocations[0].data) {
                                response.data.otwLocations[0].data.map((item) => {
                                    businessArr.push(item)
                                })
                            }
                            //机场/车站
                            if (response.data.otwLocations[1] && response.data.otwLocations[1].data) {
                                response.data.otwLocations[1].data.map((item) => {
                                    airStationArr.push(item)
                                })
                            }
                            // //医院
                            // if (response.data.otwLocations[2] && response.data.otwLocations[2].data) {
                            //     response.data.otwLocations[2].data.map((item) => {
                            //         hospitalArr.push(item)
                            //     })
                            // }
                            // //大学
                            // if (response.data.otwLocations[3] && response.data.otwLocations[3].data) {
                            //     response.data.otwLocations[3].data.map((item) => {
                            //         schoolArr.push(item)
                            //     })
                            // }
                            //购物中心
                            if (response.data.otwLocations[2] && response.data.otwLocations[2].data) {
                                response.data.otwLocations[2].data.map((item) => {
                                    shopListArr.push(item)
                                })
                            }
                            //室内景点
                            if (response.data.otwLocations[3] && response.data.otwLocations[3].data) {
                                response.data.otwLocations[3].data.map((item) => {
                                    cityScenicArr.push(item)
                                })
                            }
                            // //室外景点
                            // if (response.data.otwLocations[5] && response.data.otwLocations[5].data) {
                            //     response.data.otwLocations[5].data.map((item) => {
                            //         scenicspotsArr.push(item)
                            //     })
                            // }
                            //演出场馆
                            if (response.data.otwLocations[6] && response.data.otwLocations[6].data) {
                                response.data.otwLocations[6].data.map((item) => {
                                    performArr.push(item)
                                })
                            }
                            //购物中心
                            if (response.data.otwLocations[7] && response.data.otwLocations[7].data) {
                                response.data.otwLocations[7].data.map((item) => {
                                    shopListArr.push(item)
                                })
                            }
                        }

                        this.setState({
                            cantonList: array,
                            businessList: businessArr,
                            airStationList: airStationArr,
                            hospitalList: hospitalArr,
                            schoolList: schoolArr,
                            cityScenicList: cityScenicArr,
                            scenicspotsList: scenicspotsArr,
                            performList: performArr,
                            shopList: shopListArr,

                            hideCantonList: array.slice(0, 9),
                            hideBusinessList: businessArr.slice(0, 9),
                            hideAitStationList: airStationArr.slice(0, 9),
                            hideHospitalList: hospitalArr.slice(0, 9),
                            hideSchool: schoolArr.slice(0, 9),
                            hideCityScenic: cityScenicArr.slice(0, 9),
                            hideScenicspots: scenicspotsArr.slice(0, 9),
                            hidePerform: performArr.slice(0, 9),
                            hideShopList: shopListArr.slice(0, 9),

                            // hideCantonList:cantonList.slice(0,9)

                        })

                    }
                } else {
                    this.toastMsg(response.message || "获取行政区失败");
                }
                if (result.length > 1) {
                    let brand = result[1];
                    if (brand && brand.success) {
                        this.setState({
                            brandData: brand.data
                        })
                    } else {
                        this.toastMsg(brand.message);
                    }
                }
            }
        }).catch((err) => {
            this.hideLoadingView();
        })
    }

    /**
     * 头视图
     */
    _titleHeaderView = () => {
        const { selectDate, longDay } = this.params;
        const { keyWord , _mykeyWord} = this.state;
        let toDate = selectDate.addDays(longDay);
        return (
            <View style={{ flexDirection: "row", height: 34, borderRadius: 17, backgroundColor: Theme.normalBg, width: 230, paddingHorizontal: 10, marginRight:15 }}>
                <View style={{ justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText text={Util.Parse.isChinese() ? '入' : ''} style={{ fontSize: 10, color: Theme.aidFontColor }} />
                        <CustomText text={selectDate.format('MM.dd')} style={{ fontSize: 10, marginHorizontal: 5 }} />
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText text={Util.Parse.isChinese() ? '离' : ''} style={{ fontSize: 10, color: Theme.aidFontColor }} />
                        <CustomText text={toDate.format('MM.dd')} style={{ fontSize: 10, marginHorizontal: 5 }} />
                    </View>
                </View>
                <View style={{ width: 1, backgroundColor: Theme.promptFontColor, marginHorizontal: 5,marginVertical:5 }}></View>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', width: 170 }}
                    onPress={() => {
                        this._drawerClick()
                    }}
                >
                    <Feather name={'search'} size={16} color={Theme.promptFontColor} style={{  marginRight: 5, height: 20 }} />
                    <CustomText
                        style={{ alignContent: 'center', justifyContent: 'center', fontSize: 12, color:Theme.promptFontColor, }}
                        text={_mykeyWord ? _mykeyWord : '酒店名/地标/商圈'}
                    />
                </TouchableOpacity>
            </View>
        )
    }
    componentDidMount() {
        this._loadList();
    }

    /****************************************/
    getHotelShare(){//判断合住
        const { apply } = this.props;
        const { everyPerNum,roomCount } = this.params
        let travellersNum = roomCount * everyPerNum
        if(apply&&apply.selectApplyItem){
            let passengerCount = 0;
            // if(apply&&apply.selectApplyItem&&apply.selectApplyItem.ExtensionJson&&apply.selectApplyItem.ExtensionJson.HotelExtensionJson&&apply.selectApplyItem.ExtensionJson.HotelExtensionJson.RoomNumber>0){
            //     if(apply.selectApplyItem.ExtensionJson.HotelExtensionJson.ChummageRoomConfigs.length>0){
            //         apply.selectApplyItem.ExtensionJson.HotelExtensionJson.ChummageRoomConfigs.forEach((element)=>{
            //             if(element.ChummagePassengers && element.ChummagePassengers.length>0 && element.ChummagePassengers.length > passengerCount){
            //                 passengerCount = element.ChummagePassengers.length
            //             }
            //         })
            //     }
            // }
            if (
                apply?.selectApplyItem?.ExtensionJson?.HotelExtensionJson?.RoomNumber > 0 &&
                Array.isArray(apply.selectApplyItem.ExtensionJson.HotelExtensionJson.ChummageRoomConfigs) &&
                apply.selectApplyItem.ExtensionJson.HotelExtensionJson.ChummageRoomConfigs.length > 0
            ) {
                apply.selectApplyItem.ExtensionJson.HotelExtensionJson.ChummageRoomConfigs.forEach(element => {
                    if (Array.isArray(element.ChummagePassengers) && element.ChummagePassengers.length > passengerCount) {
                        passengerCount = element.ChummagePassengers.length;
                    }
                });
            }
            if(everyPerNum>1 && roomCount==1 && passengerCount == travellersNum){
                return true;
            }
        }else{
            return false
        }
    }

    //  获取参数
    _getQueryModel = () => {
        const { city, selectDate, longDay, currtentPosition, feeType, Domestic, roomCount,everyPerNum} = this.params;
        const { apply } = this.props;
        const { sort, lowPrice, HeightPrice, selectStart, District, Location, Brand, Address, Radius,locationId,locationName,mapPoi } = this.state;
        let Longitude = mapPoi ? mapPoi.lng : currtentPosition ? currtentPosition.longitude : '';
        let Latitude = mapPoi ? mapPoi.lat : currtentPosition ? currtentPosition.latitude : '';
        let CheckOut = selectDate.addDays(longDay);
        let start = selectStart.map(obj => {
            if (obj === '不限') return '';
            if (obj === '二星') return '2';
            if (obj === '三星') return '3';
            if (obj === '四星') return '4';
            if (obj === '五星') return '5';
        })
        let journeyid = 0;
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
        return {
            CityId: city.Code ? city.Code : '',
            CheckIn: selectDate.format('yyyy-MM-dd', true),
            CheckOut: CheckOut.format('yyyy-MM-dd', true),
            Longitude: Address ? Address.Longitude : Longitude,
            Latitude: Address ? Address.Latitude : Latitude,
            address: currtentPosition ? currtentPosition.address : '',
            FeeType: feeType,
            PageSize: 10,
            // Keyword: Location_id ? this.params.keyWord : this.state.keyWord,
            Keyword: this.state.keyWord,
            Sort: sort,
            StarRate: start.join(','),
            LowRate: lowPrice,
            HighRate: HeightPrice === '以上' ? '0' : HeightPrice,
            DistrictId: District ? District.Code : '',
            DistrictName: District ? District.Name : '',
            LocationId: locationId,
            BrandId: Brand ? Brand.Code : '',
            LocationName: locationName,
            IsAgreementHotelOnly: this.state.isSelfSigned,
            PageIndex: this.state.page,
            MatchTravelRule: this.state.MatchTravelRule,
            IsRcPriceLimit: this.state.IsRcPriceLimit,
            Breakfast: this.state.Breakfast,
            FreeCancel: this.state.FreeCancel,
            InstantConfirmation: this.state.InstantConfirmation,
            IsAgreement: this.state.IsAgreement,
            SelfOwnHotel: this.state.SelfOwnHotel,
            PaymentType: this.state.paymentArrival ? 1 : this.state.paymentAdvance ? 2 : 0,
            // Radius: Address ? Address.Radius : Radius ? Radius : null,
            Radius:mapPoi ? 2000 : 3000,
            HotelShare:this.getHotelShare(),
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            GuestNum:everyPerNum,
            IsCustomerAgreement:this.state.IsCustomerAgreement,//是否只查看协议酒店
            ApplyId: apply?.Id || 0,
            JourneyId: journeyid,
            UseMap:this.state.UseMap
        }
    }

    //   加载数据
    _loadList = () => {
        let model = this._getQueryModel();
        this.showLoadingView();
        HotelService.getHotelList(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data) {
                    if (response.data.ListData) {
                        this.state.hotelList = this.state.hotelList.concat(response.data.ListData);
                    }
                    if (this.state.hotelList.length === 0) {
                        this.state.showErrorMessage = '没有找到符合条件的酒店';
                    }
                    if (response.data.Pagination && response.data.Pagination.TotalItem && response.data.Pagination.TotalItem <= this.state.hotelList.length) {
                        this.state.isNoMoreData = true;
                    }
                    this.setState({
                        isLoding: false,
                        isLoadingMore: false
                    })
                } else {
                    this.setState({
                        isLoding: false,
                        isLoadingMore: false,
                        showErrorMessage: "没有找到符合条件的酒店"
                    })
                }

            } else {
                this.state.showErrorMessage = response.message || '获取酒店列表失败';
                this.toastMsg(response.message || '获取酒店列表失败');
                this._detailError();
            }
        }).catch(error => {
            this.hideLoadingView();
            this.state.showErrorMessage = error.message || "获取酒店列表异常";
            this.toastMsg(error.message || "获取酒店列表异常");
            this._detailError();
        })
    }

    /**
    *  请求错误处理
    */
    _detailError = () => {
        if (this.state.isLoadingMore) {
            this.state.page--;
        }
        this.setState({
            isLoding: false,
            isNoMoreData: false
        })
    }
    /**
     * 自签酒店选择
     */
    _selfSigned = () => {
        this.state.isSelfSigned = !this.state.isSelfSigned;
        this._refresh();
    }
    /**
     *  顶部筛选
     */
    _bottomBtnClickAtIndex = (index) => {
        const { city, feeType } = this.params;
        const { lowPrice, HeightPrice, selectStart } = this.state;
        if (index === 1) {
            this.setState({
                isShowSort: !this.state.isShowSort,
                isShowDistance: false,
                isSHowFilter: false,
                isShowStart: false
            }, () => {
                if (this.state.isShowSort) {
                    this.listSortView.show();
                } else {
                    this.listSortView.hide();
                }
                this.startView.hide();
                // this.listFilterView.hide();
                // this.listDistanceView.hide();
            })
        } else if (index === 2) {

            this.setState({
                isShowSort: false,
                isShowDistance: false,
                isSHowFilter: false,
                isShowStart: !this.state.isShowStart
            }, () => {
                if (this.state.isShowStart) {
                    this.startView.show(lowPrice, HeightPrice, Util.Encryption.clone(selectStart));
                } else {
                    this.startView.hide();
                }
                this.listSortView.hide();
                // this.listFilterView.hide();
                // this.listDistanceView.hide();
            })
        } else if (index === 3) {
            this.setState({
                isShowSort: false,
                isShowDistance: !this.state.isShowDistance,
                isSHowFilter: false,
                isShowStart: false
            }, () => {
                if (this.state.isShowDistance) {
                    this.listDistanceView.show();
                } else {
                    this.listDistanceView.hide();
                }
                this.listSortView.hide();
                this.startView.hide();
                this.listFilterView.hide();
            })
        } else if (index === 4) {
            this.listSortView.hide();
            this.startView.hide();
            this.push('HotelFilter', {
                CityCode: this.params.city.Code, District: this.state.District, Location: this.state.Location, Brand: this.state.Brand, 
                callBack: (District, Location, Brand, Address, Radius) => {
                    this.setState({
                        District,
                        Location,
                        Brand,
                        Address,
                        Radius,
                        locationId:Location? Location.Code : '',
                        locationName:Location? Location.Name : '',
                        keyWord:''
                    }, () => {
                        this._refresh();
                    })
                }
            });
        }
    }

    /**
     * 行内容跳转
     */
    _rowBtn = (item) => {
        const { paymentArrival,paymentAdvance } = this.state;
        const {JourneyId} = this.params;
        this.push('HotelRoomList', { ...this.params, 
            hotel: item, 
            IsAgreement: this.state.IsAgreement ,
            paymentArrival:paymentArrival,
            paymentAdvance:paymentAdvance,
            JourneyId,
            IsCustomerAgreement:this.state.IsCustomerAgreement,
        });
    }

    /**
     * 查询
     */
    _refresh = () => {
        this.setState({
            page: 1,
            isNoMoreData: false,
            isLoadingMore: false,
            isLoding: true,
            hotelList: [],
            showErrorMessage: ""
        }, () => {
            this._loadList();
        })
    }
    /**
     * 星级筛选
     */
    _startFilter = (lowPrice, HeightPrice, selectStart) => {
        this.setState({
            lowPrice,
            HeightPrice,
            isShowStart: false,
            IsRcPriceLimit:false,
            MatchTravelRule:false
        }, () => {
            this._refresh();
        })
    }

    /**
     * 其他的筛选条件
     */
    _otherFilter = (index) => {
        switch (index) {
            case 0:
                this.setState({
                    MatchTravelRule: !this.state.MatchTravelRule,
                    IsRcPriceLimit:!this.state.MatchTravelRule,
                    lowPrice:!this.state.MatchTravelRule? '0':this.state.lowPrice,
                    HeightPrice: !this.state.MatchTravelRule?'以上':this.state.HeightPrice,
                })
                break;
            case 1:
                this.setState({
                    Breakfast: !this.state.Breakfast
                })
                break;
            case 2:
                this.setState({
                    FreeCancel: !this.state.FreeCancel
                })
                break;
            case 3:
                this.setState({
                    InstantConfirmation: !this.state.InstantConfirmation
                })
                break;
            case 4:
                this.setState({
                    IsAgreement: !this.state.IsAgreement
                })
                break;
            case 5:
                this.setState({
                    SelfOwnHotel: !this.state.SelfOwnHotel
                })
                break;
            case 6:
                this.setState({
                    paymentArrival: !this.state.paymentArrival,
                    paymentAdvance: false
                })
                break;
            case 7:
                this.setState({
                    paymentAdvance: !this.state.paymentAdvance,
                    paymentArrival: false
                })
                break;
            case 8:
                this.setState({
                    IsCustomerAgreement:!this.state.IsCustomerAgreement
                })
                break;
                       
        }
        this._refresh();
    }

    /**
     * @returns 搜索推荐
     */
    _keyWordPage = () => {
        const { showCanton, hideCantonList, cantonList,
            businessList, hideBusinessList, showBusiness,
            airStationList, hideAitStationList, showAitStation,
            hospitalList, hideHospitalList, showHospital,
            cityScenicList, hideCityScenic, showCityScenic,
            scenicspotsList, hideScenicspots, showScenicspots,
            schoolList, hideSchool, showSchool,
            performList, hidePerform, showPerform,
            shopList, hideShopList, showShopList
        } = this.state
        return (
            <View style={{backgroundColor:'#fff'}}>
                <View style={{backgroundColor:'#fff'}}>
                {/* 行政区 */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 50, alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10 }}>
                    <CustomText text={'行政区'}></CustomText>
                    <CustomText text={showCanton ? '收起' : '展开'} style={{ fontSize: 12, color: 'green' }}
                        onPress={() => {
                            this.setState({
                                showCanton: !showCanton,
                                hideCantonList: cantonList.slice(0, 9)
                            })
                        }}
                    />
                </View>
                {
                    showCanton == true ?
                        this._listView(cantonList)
                        : this._listView(hideCantonList)
                }
                {/* 商圈 */}
                {
                   businessList&& businessList.length > 0?
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 50, alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10 }}>
                        <CustomText text={'商圈'}></CustomText>
                        <CustomText text={showBusiness ? '收起' : '展开'} style={{ fontSize: 12, color: 'green' }}
                            onPress={() => {
                                this.setState({
                                    showBusiness: !showBusiness,
                                    hideBusinessList: businessList.slice(0, 9)
                                })
                            }}
                        />
                    </View>
                    :
                    null
                }
                {
                    showBusiness == true ?
                        this._listView(businessList)
                        :
                        this._listView(hideBusinessList)
                }
                {/* 机场车站 */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 50, alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10 }}>
                    <CustomText text={'机场/车站'}></CustomText>
                    <CustomText text={showAitStation ? '收起' : '展开'} style={{ fontSize: 12, color: 'green' }}
                        onPress={() => {
                            this.setState({
                                showAitStation: !showAitStation,
                                hideAitStationList: airStationList.slice(0, 9)
                            })
                        }}
                    />
                </View>
                {
                    showAitStation == true ?
                        this._listView(airStationList)
                        :
                        this._listView(hideAitStationList)
                }
                {/* 医院 */}
                {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 50, alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10 }}>
                    <CustomText text={'医院'}></CustomText>
                    <CustomText text={showHospital ? '收起' : '展开'} style={{ fontSize: 12, color: 'green' }}
                        onPress={() => {
                            this.setState({
                                showHospital: !showHospital,
                                hideHospitalList: hospitalList.slice(0, 9)
                            })
                        }}
                    />
                </View> */}
                {/* {
                    showHospital == true ?
                        this._listView(hospitalList)
                        :
                        this._listView(hideHospitalList)
                } */}
                {/* 市内景点 */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 50, alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10 }}>
                    <CustomText text={'城市景点'}></CustomText>
                    <CustomText text={showCityScenic ? '收起' : '展开'} style={{ fontSize: 12, color: 'green' }}
                        onPress={() => {
                            this.setState({
                                showCityScenic: !showCityScenic,
                                hideCityScenic: cityScenicList.slice(0, 9)
                            })
                        }}
                    />
                </View>
                {
                    showCityScenic == true ?
                        this._listView(cityScenicList)
                        :
                        this._listView(hideCityScenic)
                }
                {/* 市外景点 */}
                {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 50, alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10 }}>
                    <CustomText text={'市外景点'}></CustomText>
                    <CustomText text={showScenicspots ? '收起' : '展开'} style={{ fontSize: 12, color: 'green' }}
                        onPress={() => {
                            this.setState({
                                showScenicspots: !showScenicspots,
                                hideScenicspots: scenicspotsList.slice(0, 9)
                            })
                        }}
                    />
                </View> */}
                {
                    showScenicspots == true ?
                        this._listView(scenicspotsList)
                        :
                        this._listView(hideScenicspots)
                }
                {/* 大学 */}
                {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 50, alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10 }}>
                    <CustomText text={'大学'}></CustomText>
                    <CustomText text={showSchool ? '收起' : '展开'} style={{ fontSize: 12, color: 'green' }}
                        onPress={() => {
                            this.setState({
                                showSchool: !showSchool,
                                hideSchool: schoolList.slice(0, 9)
                            })
                        }}
                    />
                </View> */}
                {/* {
                    showSchool == true ?
                        this._listView(schoolList)
                        :
                        this._listView(hideSchool)
                } */}
                {/* 演出场馆 */}
                {
                    performList&& performList.length > 0?
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 50, alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10 }}>
                        <CustomText text={'演出场馆'}></CustomText>
                        <CustomText text={showPerform ? '收起' : '展开'} style={{ fontSize: 12, color: 'green' }}
                            onPress={() => {
                                this.setState({
                                    showPerform: !showPerform,
                                    hidePerform: performList.slice(0, 9)
                                })
                            }}
                        />
                    </View>
                    :
                    null
                }
                {
                    showPerform == true ?
                        this._listView(performList)
                        :
                        this._listView(hidePerform)
                }
                {/* 购物中心 */}
                {
                    shopList&& shopList.length > 0?
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', height: 50, alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10 }}>
                        <CustomText text={'购物中心'}></CustomText>
                        <CustomText text={showShopList ? '收起' : '展开'} style={{ fontSize: 12, color: 'green' }}
                            onPress={() => {
                                this.setState({
                                    showShopList: !showShopList,
                                    hideShopList: shopList.slice(0, 9)
                                })
                            }}
                        />
                    </View>
                    :
                    null
                }
                {
                    showShopList == true ?
                        this._listView(shopList)
                        :
                        this._listView(hideShopList)
                }
                <View style={{ height: 100 }} />
                </View>
            </View>
        )
    }

    _searchOrder = () => {        
        // this.setState({
        //     page: 1,
        //     isLoading: true,
        //     isLoadingMore: false,
        //     isNoMoreData: false,
        //     dataList: [],
        //     key_word: true
        // }, () => {
        //     this.getFilterClick();
        // })       
        const { keyWord } = this.state;
        this.setState({
            page: 1,
            isNoMoreData: false,
            isLoadingMore: false,
            isLoding: true,
            hotelList: [],
            showErrorMessage: "",
            _mykeyWord:keyWord,
            UseMap:false,
            mapPoi:null
        }, () => {
            this._loadList();
            this._navigationHeaderView = {
                titleView: this._titleHeaderView(),
                rightButton: <TouchableOpacity underlayColor='transparent' onPress={this._getTravelRule} style={{justifyContent:'center',alignItems:'center',paddingRight: Util.Parse.isChinese() ? 16 : 10}}>
                    <Image style={{height:16,width:16}} source={require('../../res/Uimage/ruleIcon.png')}/>
                </TouchableOpacity>
            }
        })
        this._hiddenTipView()               
    }

    //获取筛选数据
    getFilterClick = () => {
        const { keyWord } = this.state;
        const { city } = this.params;
        let model = {
            CityCode: city.Code,
            Keyword: keyWord,
        }
        this.showLoadingView();
        HotelService.HotelKeywordQuery(model).then(response => {
            this.hideLoadingView();
            if (response && response.success && response.data) {
                this.setState({
                    dataList: response.data
                })
            } else {
                this.toastMsg(response.message || '很抱歉，没有符合条件的酒店');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '很抱歉，没有符合条件的酒店');
        })
    }

    renderBody() {
        const { isSelfSigned, hotelList, isLoding, isLoadingMore, isNoMoreData, keyWord, options, sort, lowPrice, HeightPrice, selectStart, showErrorMessage, key_word } = this.state;
        let selectAction = sort;
        if (Util.Parse.isChinese()) {
            let index = SortEn.findIndex(item => item === sort);
            if (index > -1) {
                selectAction = SortCn[index];
            }
        }
        return (
            <View style={{ flex: 1, position: "relative" }}>
                {this._renderTop()}
                {this._renderOtherSelect()}
                {
                    hotelList.length === 0 && showErrorMessage ?
                        this._renderError()
                        :
                        <FlatList
                            data={hotelList}
                            renderItem={this._renderItem}
                            showsVerticalScrollIndicator={false}
                            refreshControl={ViewUtil.getRefreshControl(isLoding, () => {
                                this._refresh();
                            })}

                            keyExtractor={(item, index) => String(index)}
                            ListFooterComponent={ViewUtil.getRenderFooter(isLoadingMore, isNoMoreData)}
                            onEndReachedThreshold={0.1}
                            onEndReached={() => {
                                setTimeout(() => {
                                    if (this.canLoad && !isNoMoreData && !isLoadingMore && !isLoding) {
                                        this.state.page++;
                                        this.setState({
                                            isLoadingMore: true
                                        }, () => {
                                            this._loadList();
                                            this.canLoad = false;
                                        })
                                    }
                                }, 100);
                            }}
                            onScrollBeginDrag={() => {
                                // alert('执行了');
                                this.canLoad = true;
                            }}
                        />
                }
                <ListSortView ref={o => this.listSortView = o} sort={sort} callBack={(obj) => {
                    this.setState({
                        sort: obj,
                        isShowSort: false
                    }, () => {
                        this._refresh();
                    })
                }} />
                <StartView ref={o => this.startView = o} callBack={this._startFilter} />
                {/* <ListFilterView ref={o => this.listFilterView = o} />
                <ListDistanceView ref={o => this.listDistanceView = o} /> */}
                <Animated.View style={{ position: "absolute", top: this.state.securetyTipViewY, backgroundColor: 'rgba(52,52,52,0.6)', height: global.screenHeight, width: global.screenWidth }}>
                    <View style={{ backgroundColor: '#fff', flex: 1 }}>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity style={{ backgroundColor: '#fff', height: 50, width: 50, alignItems: 'center', justifyContent: 'center' }} onPress={this._hiddenTipView}>
                                <AntDesign name={'close'} size={20} style={{ color: 'gray' }}></AntDesign>
                            </TouchableOpacity>
                            <View style={{ height: 50, backgroundColor: Theme.lineColor, borderRadius: 6 }}>
                                <View style={{ flex: 1, width: global.screenWidth - 80, justifyContent: 'flex-end', borderRadius: 6,borderWidth:1 ,borderColor:'#999',backgroundColor:'#fff'}}>
                                    <SearchInput placeholder='(选填)酒店名/地标/商标'
                                        value={keyWord}
                                        onChangeText={keyWord =>
                                            this.setState({
                                                keyWord: keyWord,
                                                key_word: false,
                                            }, () => {
                                                this._loadPoiQueryList();
                                            })
                                        }
                                        onSubmitEditing={this._searchOrder}
                                    />
                                </View>
                            </View>
                        </View>
                        
                        <ScrollView 
                            keyboardShouldPersistTaps='always'
                            keyboardDismissMode='on-drag'
                            showsVerticalScrollIndicator={false}
                        >
                        {Util.Parse.isChinese() ? this.PoiQueryList() : null}
                        {!key_word ? this._keyWordPage() :
                            keyWord ? this._chooseHotel() : this._keyWordPage()
                        }
                        </ScrollView>

                    </View>
                </Animated.View>
            </View>
        )
    }
    PoiQueryList() {
        const { PoiQueryList } = this.state;
        return(
            <FlatList
                keyboardShouldPersistTaps='always'
                keyboardDismissMode='on-drag'      // 拖拽时收起键盘
                data={PoiQueryList}
                style={{paddingHorizontal:60}}
                renderItem={this._renderPoiItem}
                showsVerticalScrollIndicator={false}
                keyExtractor={(item, index) => String(index)}
            />
        )
    }
    _renderPoiItem = ({ item, index }) => {
       return <TouchableOpacity underlayColor='transparent' 
                onPress={() => {
                    this._choosePoi(item);
                }} 
                style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    paddingVertical: 10,
                }}>
            <CustomText text={item.Name} style={{fontSize:14,color:Theme.theme}}></CustomText>
        </TouchableOpacity>
    }
    _choosePoi = (item) => {
        const { keyWord } = this.state;
            this.setState({
                page: 1,
                isNoMoreData: false,
                isLoadingMore: false,
                isLoding: true,
                hotelList: [],
                showErrorMessage: "",
                _mykeyWord:item.Name,
                mapPoi: item.location,
                UseMap: true,
            }, () => {
                this._loadList();
                this._navigationHeaderView = {
                    titleView: this._titleHeaderView(),
                    rightButton: <TouchableOpacity underlayColor='transparent' onPress={this._getTravelRule} style={{justifyContent:'center',alignItems:'center',paddingRight: Util.Parse.isChinese() ? 16 : 10}}>
                        <Image style={{height:16,width:16}} source={require('../../res/Uimage/ruleIcon.png')}/>
                    </TouchableOpacity>
                }
            })
            this._hiddenTipView();
    }
    _loadPoiQueryList = () => {
        let model = {
          Query: this.state.keyWord,
          Region: this.params.city.Name,
          Domestic: true,
        }
        HotelService.HotelOrderPoiQuery(model).then(response => {
            if (response && response.success && response.data) {
                this.setState({
                    PoiQueryList: response.data
                })
            } else {
                // this.toastMsg(response.message);
            }
        }).catch(error => {
            this.hideLoadingView();
            // this.toastMsg(error.message);
        })
    }
    _renderChooseItem = ({ item, index }) => {
        const { keyWord, hotelData,paymentArrival,paymentAdvance } = this.state;
        const { city, selectDate, longDay,roomCount,JourneyId } = this.params;
        let hotel = item;
        hotel.CityCode = city.Code
        hotel.HotelCode = item.HotelId
        hotel.HotelName = item.Name
        return (
            <TouchableOpacity style={styles.listItemstyle}
                onPress={() => {
                    (item.HotelId ?
                        this.push('HotelRoomList', {
                             selectDate: selectDate, 
                             longDay: longDay,
                             roomCount: roomCount, 
                             hotel: hotel, 
                             city: city,
                             paymentArrival:paymentArrival,
                             paymentAdvance:paymentAdvance,
                             JourneyId,
                        })
                        :
                        this.setState({
                            keyWord: item.Name,
                        }, () => {
                            this._refresh();
                        }))
                    this._hiddenTipView();
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome5 name={'building'} size={16} color={Theme.theme} />
                    <View style={{ marginLeft: 10 }}>
                        {
                            item.Name.substring(0, keyWord.length) == keyWord ?
                                <View style={{ flexDirection: 'row' }}>
                                    <CustomText text={item.Name.substring(0, keyWord.length)} style={{ color: Theme.theme }} />
                                    <CustomText text={item.Name.slice(keyWord.length)} />
                                </View> :
                                <CustomText text={item.Name} />
                        }

                        <CustomText text={item.MallName} style={{ marginTop: 5, color: Theme.darkColor }} />
                    </View>
                </View>
                <CustomText text={item.TypeDesc} style={{ marginRight: 10 }} />
            </TouchableOpacity>
        )
    }
    _chooseHotel = () => {
        const { dataList } = this.state;
        return (
            <View>
                <FlatList
                    style={{marginBottom:150}}
                    data={dataList}
                    renderItem={this._renderChooseItem}
                    showsVerticalScrollIndicator={false}
                    // refreshControl={ViewUtil.getRefreshControl(isLoading, () => {
                    //     this.setState({
                    //         page: 1,
                    //         isLoading: true,
                    //         isNoMoreData: false,
                    //         isLoadingMore: false,
                    //         dataList: []
                    //     }, () => {
                    //         this._loadList();
                    //     })
                    // })}
                    // keyExtractor={(item, index) => String(index)}
                    // onEndReachedThreshold={0.1}
                    // ListFooterComponent={ViewUtil.getRenderFooter(isLoadingMore, isNoMoreData)}
                    // onEndReached={() => {
                    //     setTimeout(() => {
                    //         if (this.canLoad && !isNoMoreData && !isLoadingMore && !isLoading) {
                    //             this.state.page++;
                    //             this.setState({
                    //                 isLoadingMore: true
                    //             }, () => {
                    //                 this._loadList();
                    //                 this.canLoad = false;
                    //             })
                    //         }
                    //     }, 100)
                    // }}如家
                    onMomentumScrollBegin={() => {
                        this.canLoad = true
                    }}
                />
            </View>
        )

    }
    _renderError = () => {
        const { showErrorMessage } = this.state;
        return (
            <View style={{ flex: 1 }}>
                {
                    showErrorMessage === '网络超时，请检查您的网络' || showErrorMessage === 'Network request failed' ?
                        <NetworkFaildView refresh={this._refresh} /> :
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <CustomText style={{ color: 'gray' }} text={showErrorMessage || '没有找到符合条件的酒店'} />
                        </View>
                }
            </View>
        )
    }
    _renderItem = ({ item: data, index }) => {
        // let distance = data.Distance / 1000;
        // distance = Math.round(distance * 10) / 10;
        if(!data){return}
        const {hotelFacilitiesImages} = this.state;
        let reViewScore = data.CommentScore ? (data.CommentScore * 100) + '%' : null;
        let starArr = [];
        let starNum = data.StarRate?data.StarRate:data.RecommendStar
        for (let i = 0; i<starNum ; i++){
            if(i < 5){
                starArr.push(i);
            }
        }
        let groupText = data.Group&&data.Group.length > 20 ? data.Group.substring(0, 20) + '...' : data.Group
        return (
            <TouchableHighlight underlayColor='transparent' onPress={this._rowBtn.bind(this, data)} style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ borderBottomColor: Theme.lineColor, backgroundColor: '#ffffff', borderBottomWidth: 1, flexDirection: 'row', marginTop: 5,marginHorizontal:10,borderRadius:6,paddingBottom:5 }}>
                    <Image style={{ marginLeft: 15, marginTop: 15, marginBottom: 5, width: 100,height: 120, justifyContent: 'flex-end', borderRadius: 4 }} source={data.CoverImage && !data.loadImageError ? { uri: data.CoverImage } : require('../../res/image/replaceFcm.jpeg')}
                        onError={() => {
                            data.loadImageError = true;
                            this.setState({});
                        }}
                    >
                    </Image>
                    <View style={{ marginLeft: 10, flex: 1, marginTop: 15}}>
                        <CustomText style={{fontSize:14,fontWeight:'bold'  }} numberOfLines={1} text={Util.Parse.isChinese() ? (data.HotelName) : data.HotelNameEn} />
                        <View style={{ marginTop: 0 }}>
                            {
                               starArr.length>0?
                                <View style={{ flexDirection: 'row' }}>
                                    {  
                                    starArr.map(()=>{
                                        return<Image style={{height:14,width:14,marginRight:2,marginTop:5}} source={require('../../res/Uimage/hotelFloder/_star.png')}></Image>
                                    }) 
                                    }
                                </View>:null
                            }
                            <View style={{flexDirection:'row',marginTop:5,borderRadius:2}}>
                            {
                              groupText && data.AgreemetTags&&data.AgreemetTags.includes('3SAgreement')?
                               <CustomText text={groupText} style={{fontSize: 11, paddingHorizontal: 2 , color:'#fff',backgroundColor:Theme.theme,marginRight:2,borderRadius:2,padding:1 }}/>
                               :null
                            }
                            {
                                data.Tags && data.Tags.map((obj,index)=>{
                                        return (
                                            <CustomText text={obj} style={{fontSize: 11,borderWidth:1, paddingHorizontal: 2 ,borderRadius:2, color:Theme.theme,borderColor:Theme.theme,marginRight:2 }}/>
                                        )
                                })
                            }
                            {
                                data.IsAgreement ?
                                    <View style={{ }}>
                                        <CustomText text='专享协议' style={{fontSize: 11, paddingVertical:1,backgroundColor: Theme.orangelableColor, paddingHorizontal: 5 ,borderRadius:2, color:'#fff'}} />
                                    </View>
                                : null
                            }
                            
                            </View>
                            <View style={{ marginRight: 5, flexDirection: 'row',justifyContent:"space-between" }}>
                                    <View style={{flexDirection:'row',alignItems:'center',marginTop:5}}>
                                    {
                                        data.AgreemetTags && data.AgreemetTags.map(obj => {
                                            if (obj === '2SAgreement' || obj ==='价格计划2S协议') {
                                                return (<View style={{ marginRight:2 }}>
                                                    <CustomText text={"FCM"} style={{ fontSize: 11, paddingVertical:1,backgroundColor: Theme.theme, paddingHorizontal: 5 ,borderRadius:2, color:'#fff' }} />
                                                </View>)
                                            }else if (obj === '3SAgreement' || obj ==='价格计划3S协议') {
                                                return (<View style={{ marginRight:2 }}>
                                                    <CustomText text={Util.Parse.isChinese()?'协议':'Corp'} style={{ fontSize: 11, paddingVertical:1,backgroundColor: Theme.orangelableColor, paddingHorizontal: 5 ,borderRadius:2, color:'#fff'}} />
                                                </View>)
                                            }else{
                                                return
                                            }
                                        })
                                    }
                                    {
                                        this.props.highRisk && this.props.highRisk.Level>0 &&
                                        <Foundation name={'info'} style={{ marginLeft: 5 }} size={20} color={this.props.highRisk.Level == 1 ? Theme.theme : this.props.highRisk.Level == 2 ? Theme.redColor : null} />
                                    }
                                    </View>
                                    <View style={{ flexDirection: 'row', marginRight: 5,  }}>
                                            {data.LowRate == 0 || data.LowRate == -1 ? null : <CustomText style={{ fontSize: 12, marginTop: 8, color: Theme.theme }} text='¥' />}
                                            <CustomText style={{ color: Theme.theme, fontSize: 20 }} text={data.LowRate == 0 || data.LowRate == -1 ? '暂无报价' : data.LowRate} />
                                            {data.LowRate == 0 || data.LowRate == -1 ? null : <CustomText style={{ fontSize: 12, marginTop: 8, color: Theme.theme }} text='起' />}
                                    </View>
                            </View>
                            {data.BusinessZoneName&&<CustomText style={{ fontSize: 12, marginTop: 0 ,marginTop:5 }}  numberOfLines={2} text={data.BusinessZoneName} />}
                            <View style={{flexDirection:'row',alignItems:'center'}}>
                                <EvilIcons name={'location'} style={{ fontSize: 17, color: 'gray',marginTop:5 }} ></EvilIcons>
                                <CustomText style={{ fontSize: 12, color: 'gray',marginTop:5 }} numberOfLines={2} text={data.Address} /> 
                            </View>
                            <View style={{ flexDirection: 'row', marginTop: 5,marginLeft:5 }}>
                                {
                                    data.Facilities && data.Facilities.map((obj, index) => {
                                        const imageSource = hotelFacilitiesImages[obj?.IconClass];
                                        return (
                                            imageSource? <Image style={{ height: 14, width: 16, marginRight:5 }} resizeMode="contain" source={imageSource}></Image>:null
                                        )
                                    })
                                }
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableHighlight>
        )

    }

    _renderTop = () => {
        const { isSHowFilter, isShowDistance, isShowSort, isShowStart } = this.state;
        return (
            <View style={{ backgroundColor: 'white', height: 45, flexDirection: 'row', borderBottomColor: Theme.lineColor, borderBottomWidth: 0.5 }}>
                <TouchableHighlight style={styles.filter_item} underlayColor='transparent' onPress={this._bottomBtnClickAtIndex.bind(this, 1)}>
                    <View style={styles.filter_View}>
                        <CustomText text='默认排序' style={{ color: isShowSort ? Theme.theme : Theme.annotatedFontColor, fontSize:14 }} />
                        <AntDesign name={isShowSort ? 'caretup' : 'caretdown'} size={8} color={isShowSort ?Theme.theme:'gray'} style={{ marginLeft: 3 }} />
                    </View>
                </TouchableHighlight >
                <TouchableHighlight style={styles.filter_item} underlayColor='transparent' onPress={this._bottomBtnClickAtIndex.bind(this, 2)}>
                    <View style={styles.filter_View}>
                        <CustomText text='价格排序' style={{ color: isShowStart ? Theme.theme : Theme.annotatedFontColor, fontSize:14 }} />
                        <AntDesign name={isShowStart ? 'caretup' : 'caretdown'} size={8} color={isShowStart ?Theme.theme:'gray'} style={{ marginLeft: 3 }} />
                    </View>
                </TouchableHighlight>
                {/* <TouchableHighlight style={styles.filter_item} underlayColor='transparent' onPress={this._bottomBtnClickAtIndex.bind(this, 3)}>
                    <View style={styles.filter_View}>
                        <CustomText text='位置距离' style={{ color: isShowDistance ? Theme.theme : Theme.annotatedFontColor }} />
                        <AntDesign name={isShowDistance ? 'caretup' : 'caretdown'} size={18} color={isShowDistance?Theme.theme:'gray'} style={{ marginRight: 5 }} />
                    </View>
                </TouchableHighlight> */}
                <TouchableHighlight style={styles.filter_item} underlayColor='transparent' onPress={this._bottomBtnClickAtIndex.bind(this, 4)}>
                    <View style={styles.filter_View}>
                        <CustomText text='更多筛选' style={{ color: isSHowFilter ? Theme.theme : Theme.annotatedFontColor, fontSize:14 }} />
                        <AntDesign name={isSHowFilter ? 'caretup' : 'caretdown'} size={8} color={isSHowFilter?Theme.theme:'gray'} style={{ marginRight: 5 }} />
                    </View>
                </TouchableHighlight>
            </View >
        )
    }


    _renderOtherSelect = () => {
        const { MatchTravelRule, paymentArrival, paymentAdvance,IsCustomerAgreement, Breakfast, FreeCancel, InstantConfirmation, IsAgreement, SelfOwnHotel } = this.state;
        const { customerInfo } = this.params;
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center',padding: 10,backgroundColor:'#fff' }}>
                <ScrollView showsHorizontalScrollIndicator={false} horizontal={true}>
                <View style={[styles.filter_other_view, { backgroundColor: MatchTravelRule ? Theme.greenBg : 'white',borderColor:MatchTravelRule ?Theme.theme:Theme.lineColor }]}>
                    <CustomText text='符合城市标准' style={{ fontSize: 12, color: MatchTravelRule ? Theme.theme : Theme.annotatedFontColor }} onPress={this._otherFilter.bind(this, 0)} />
                </View>
                {
                    customerInfo.Setting.HotelCorpPaymentType != 2 ?
                    <View style={[styles.filter_other_view, { backgroundColor: paymentArrival ? Theme.greenBg : 'white',borderColor:paymentArrival ?Theme.theme:Theme.lineColor }]}>
                        <CustomText text='到付' style={{ fontSize: 12, color: paymentArrival ? Theme.theme : Theme.annotatedFontColor }} onPress={this._otherFilter.bind(this, 6)} />
                    </View> 
                    : null
                }
                {
                    customerInfo.Setting.HotelCorpPaymentType != 1 ?
                    <View style={[styles.filter_other_view, { backgroundColor: paymentAdvance ? Theme.greenBg : 'white',borderColor:paymentAdvance ?Theme.theme:Theme.lineColor }]}>
                        <CustomText text='预付' style={{ fontSize: 12, color: paymentAdvance ? Theme.theme : Theme.annotatedFontColor }} onPress={this._otherFilter.bind(this, 7)} />
                    </View> 
                    : null
                }
                {
                    <View style={[styles.filter_other_view, { backgroundColor: IsCustomerAgreement ? Theme.greenBg : 'white',borderColor:IsCustomerAgreement ?Theme.theme:Theme.lineColor }]}>
                        <CustomText text='协议酒店' style={{ fontSize: 12, color: IsCustomerAgreement ? Theme.theme : Theme.annotatedFontColor }} onPress={this._otherFilter.bind(this, 8)} />
                    </View> 
                }
                </ScrollView>
            </View>
        )
    }
}

const getStatePorps = state => ({
    highRisk:state.highRisk.highRisk,
    compReferenceEmployee: state.compReferenceEmployee.ReferenceEmployee,//综合订单出差人选定参考出差人信息
    comp_userInfo:state.comp_userInfo,
    apply: state.apply.apply,
})
export default connect(getStatePorps)(HotelListScreen);


let SortCn = ['推荐排序', '价格从低到高', '价格从高到低', '距离从近到远'];
let SortEn = ['Default', 'PriceAsc', 'PriceDesc', 'distanc',];
const styles = StyleSheet.create({
    filter_item: {
        flex: 1,
    },
    filter_View: {
        flex: 1,
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: 'center'
    },
    filter_other_view: {
        height: 25,
        marginRight: 5,
        justifyContent: 'center',
        alignItems: "center",
        borderRadius: 4,
        paddingHorizontal: 5,
        borderWidth:1,
    },
    alertStyle: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
    },
    boxStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 5,
        borderRadius: 5,
    },
    titleStyle: {
        height: 30,
        width: 1,
        backgroundColor: 'gray'
    },
    itemStyle: {
        borderTopWidth: 1,
        borderColor: Theme.lineColor,
        width: global.screenWidth / 3 - 22,
        alignItems: 'center',
        height: 50,
        justifyContent: 'center'
    },
    item_Style: {
        borderTopWidth: 1,
        borderColor: Theme.lineColor,
        width: global.screenWidth / 3,
        alignItems: 'center',
        height: 50,
        justifyContent: 'center',
        // backgroundColor:'#ffa'
    },
    rowView: {
        borderWidth: 1,
        borderColor: Theme.lineColor,
        borderRadius: 6,
        height: 50,
        alignItems: 'center',
        marginHorizontal: 10
    },
    listItemstyle: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderColor: Theme.lineColor,
        padding: 10,
        justifyContent: 'space-between'
    }
})