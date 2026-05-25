import React from 'react';
import {
    View,
    Image,
    FlatList,
    StyleSheet,
    TouchableHighlight,
    TouchableOpacity,
    Animated,
    ScrollView,
} from 'react-native';
import SuperView from '../../super/SuperView';
import CustomText from '../../custom/CustomText';
import ViewUtil from '../../util/ViewUtil';
import HotelService from '../../service/HotelService';
import Theme from '../../res/styles/Theme';
import Util from '../../util/Util';
import StartView from '..//hotel/ListStartView';
import NetworkFaildView from '../../custom/NetWorkFaildView';
import CommonEnum from '../../enum/CommonEnum';
import CommonService from '../../service/CommonService';
import CustomeTextInput from '../../custom/CustomTextInput';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ListSortView from './ListSortView';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Pop from 'rn-global-modal';
import { connect } from 'react-redux';
import Foundation from 'react-native-vector-icons/Foundation';
import EvilIcons from 'react-native-vector-icons/EvilIcons';

 class InterHotelListScreen extends SuperView {
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
            keyWord: (this.params.keyWord ?? ''),
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
            securetyTipViewY: new Animated.Value(global.screenHeight),
            cantonList:[],//行政区
            hideCantonList:[],//收起后的行政区
            showCanton:false,//是否收起

            businessList: [],//商圈
            hideBusinessList: [],//收起商圈
            showBusiness:false,//是否收起商圈

            airStationList: [],//机场、车票
            hideAitStationList: [],//收起机场、车票
            showAitStation:false,//是否收起机场、车票

            hospitalList: [],//医院
            hideHospitalList: [],//收起医院
            showHospital:false,//是否收起医院

            schoolList: [],//大学
            hideSchool: [],//收起大学
            showSchool:false,//是否收起大学

            cityScenicList: [],//室内景点
            hideCityScenic: [],//收起室内景点
            showCityScenic:false,//是否收起室内景点

            scenicspotsList: [],//室外景点
            hideScenicspots: [],//收起景点
            showScenicspots:false,//是否收起景点

            schoolList: [],//大学
            hideSchool: [],//收起大学
            showSchool:false,//是否收起大学

            performList: [],//演出场馆
            hidePerform: [],//收起演出场馆
            showPerform:false,//是否收起演出场馆

            shopList: [],//购物中心
            hideShopList: [],//购物中心
            showShopList: [],//购物中心: [],//购物中心

            key_word:null,
            dataList:[],
            IsCustomerAgreement:false,
            IsRcPriceLimit:false,
            hotelFacilitiesImages:hotelFacilitiesImages


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
    /**
     *  获取差旅标准
     */
    _getTravelRule = () => {
        const { city } = this.params;
        const { compReferenceEmployee } = this.props;
        let model = compReferenceEmployee? {
            Extra:{CityCode: city.Code},
            OrderCategory: CommonEnum.orderIdentification.intlHotel,
            RulesTravelId:compReferenceEmployee.RulesTravelId
        }:
        {
            Extra:{CityCode: city.Code},
            OrderCategory: CommonEnum.orderIdentification.intlHotel,
        }
        this.showLoadingView();
        CommonService.GetTravelStandards(model).then(response => {
            this.hideLoadingView();
            if (response?.data?.RuleDesc?.length > 0) {
                Pop.show(
                    <View style={styles.alertStyle}>
                       <View style={{alignItems:'center',justifyContent:'center'}}>
                           <CustomText text={'温馨提示'} style={{margin:6,fontSize:18, fontWeight:'bold'}} />
                       </View>
                       <View style={{width:'100%'}}>
                           <CustomText text={response.data.OrderCategoryDesc} style={{padding:2,fontSize:14,fontWeight:'bold'}}/>
                           {response.data.RuleDesc&&response.data.RuleDesc.length>0?
                               response.data.RuleDesc.map((item)=>{
                                   return(
                                     <View style={{flexDirection:'row',padding:2}}>
                                        <CustomText text={item.Name+': '+item.Desc}/>
                                     </View>
                                   )
                               })
                               :
                               <View style={{flexDirection:'row',padding:2}}>
                                <CustomText text={'国际酒店:不限'}/>
                                </View>
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
                this.showAlertView('国际酒店:不限');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }
    _drawerClick = () => {
        this.setState({
            keyWord:''
        })
        this._showTipView()
        // this._getKeyword()
    }
    //展示View
    _showTipView = () => {
        // Animated.timing(
        //     this.state.securetyTipViewY,
        //     {
        //         toValue: -45,
        //         duration: 300,   //动画时长300毫秒
        //     }
        // ).start();
    }
    // //隐藏view
    // _hiddenTipView = () => {
    //     Animated.timing(
    //         this.state.securetyTipViewY,
    //         {
    //             toValue: global.screenHeight,
    //             duration: 300, //动画时长300毫秒
    //         }).start();
    // }
     //可选关键字UI
     _listView = (list)=>{
        return(
            <View style={{ backgroundColor: '#fff',width:global.screenWidth,flexDirection:'row',flexWrap:'wrap',padding:10 }}>
                {
                    list&&list.map((item,index)=>{
                        return(
                            (index-1)%3 === 0?
                            <TouchableOpacity style={styles.boxStyle} 
                                              onPress={()=>{
                                                  this.setState({
                                                      keyWord:item
                                                  },()=>{
                                                    this._searchOrder();
                                                })
                                              }}
                            >
                                <View style={styles.titleStyle}/>
                                    <View style={{
                                        borderTopWidth:1,
                                        borderColor:Theme.lineColor,
                                        width:global.screenWidth/3-22,
                                        alignItems:'center',
                                        height:50,
                                        justifyContent:'center'
                                    }}>
                                        <CustomText text={item}></CustomText>
                                    </View>
                                <View style={styles.titleStyle}/> 
                            </TouchableOpacity>
                            :
                            <TouchableOpacity style={{
                                borderTopWidth:1,
                                borderColor:Theme.lineColor,
                                width:global.screenWidth/3,
                                alignItems:'center',
                                height:50,
                                justifyContent:'center',
                                // backgroundColor:'#ffa'
                            }}
                                                onPress={()=>{
                                                    this.setState({
                                                        keyWord:item
                                                    },()=>{
                                                        this._searchOrder();
                                                    })
                                                }}
                            >
                                <CustomText text={item}></CustomText>
                            </TouchableOpacity>
                        )
                    })
                }
            </View>
        )
    }
    /**
     * 头视图
     */
    _titleHeaderView = () => {
        const { selectDate, longDay } = this.params;
        const { keyWord } = this.state;
        let toDate = selectDate.addDays(longDay);
        return (
            <View style={{ flexDirection: "row", height: 34, borderRadius: 17, backgroundColor: Theme.normalBg, width: 230, paddingHorizontal: 10, marginRight:15}}>
                <View style={{ justifyContent: 'center' }}>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText text={Util.Parse.isChinese()?'入':''} style={{ fontSize: 10, color: Theme.aidFontColor }} />
                        <CustomText text={selectDate.format('MM.dd')} style={{ fontSize: 10,marginLeft:2 }} />
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <CustomText text={Util.Parse.isChinese()?'离':''} style={{ fontSize: 10, color: Theme.aidFontColor }} />
                        <CustomText text={toDate.format('MM.dd')} style={{ fontSize: 10 ,marginLeft:2}} />
                    </View>
                </View>
                <View style={{ width: 1, backgroundColor: Theme.lineColor, marginHorizontal: 5 }}></View>
                {/* <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center',justifyContent:'center'}}
                    onPress={() => {
                        this._drawerClick()
                    }}
                >
                    <Feather name={'search'} size={16} color={'gray'} style={{ marginHorizontal: 5 ,height:20}} />
                     <CustomText
                        style={{ alignContent: 'center', justifyContent: 'center', fontSize: 12, color:Theme.promptFontColor, }}
                        text={keyWord ? keyWord : '酒店名/地标/商圈'}
                    />
                </TouchableOpacity> */}
                <View style={{ flexDirection: 'row', alignItems: 'center',justifyContent:'center'}}>
                    <Feather name={'search'} size={16} color={'gray'} style={{ marginHorizontal: 5 ,height:20}} />
                    <CustomeTextInput style={{ alignContent: 'center', justifyContent: 'center', fontSize: 12, color: 'gray', }}
                                      value={(keyWord ?? '')} 
                                      placeholder={Util.Parse.isChinese()?'酒店名/地标/商圈':'hotel name/ bank...'}
                                      onChangeText={text => this.setState({ keyWord: (text ?? '') })} 
                                      onSubmitEditing={this._refresh} />
                </View>
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
        const { city, selectDate, longDay, currtentPosition, feeType, keyWord,roomCount,everyPerNum} = this.params;
        let Longitude = currtentPosition ? currtentPosition.longitude : '';
        let Latitude = currtentPosition ? currtentPosition.latitude : ''
        let CheckOut = selectDate.addDays(longDay);
        const { apply } = this.props;
        const { sort, lowPrice, HeightPrice, selectStart, District, Location, Brand, Address, Radius } = this.state;
        // let start = selectStart.map(obj => {
        //     if (obj === '不限') return '';
        //     if (obj === '二星') return '2';
        //     if (obj === '三星') return '3';
        //     if (obj === '四星') return '4';
        //     if (obj === '五星') return '5';
        // })
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
            Longitude:Address?Address.Longitude: Longitude,
            Latitude: Address?Address.Latitude: Latitude,
            address: currtentPosition ? currtentPosition.address : '',
            FeeType: feeType,
            PageSize: 10,
            Keyword: this.state.keyWord,
            Sort: sort,
            // StarRate: start.join(','),
            LowRate: lowPrice,
            HighRate: HeightPrice === '以上' ? '0' : HeightPrice,
            DistrictId: District ? District.Code : '',
            DistrictName: District ? District.Name : '',
            LocationId: Location ? Location.Code : '',
            BrandId: Brand ? Brand.Code : '',
            LocationName: Location ? Location.Name : '',
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
            // Radius:Address?Address.Radius:Radius?Radius:null,
            Radius:3000,
            Domestic:false,
            RoomCount:roomCount,
            HotelShare:this.getHotelShare(),
            ReferenceEmployeeId:this.props.comp_userInfo&&this.props.comp_userInfo.ReferenceEmployeeId?this.props.comp_userInfo.ReferenceEmployeeId:0,
            ReferencePassengerId:this.props.comp_userInfo&&this.props.comp_userInfo.referencPassengerId,
            GuestNum:everyPerNum,
            IsCustomerAgreement:this.state.IsCustomerAgreement,//是否只查看协议酒店
            ApplyId: apply?.Id || 0,
            JourneyId: journeyid
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
        }
    }

    /**
     * 行内容跳转
     */
    _rowBtn = (item) => {
        const { paymentArrival, paymentAdvance } = this.state;
        const {JourneyId} = this.params;
        this.push('InterlHotelRoomList', { 
            ...this.params, 
            hotel: item, 
            IsAgreement: this.state.IsAgreement,
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
            selectStart,
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

    _searchOrder = () => {
        this.setState({
            page: 1,
            isLoading: true,
            isLoadingMore: false,
            isNoMoreData: false,
            dataList: [],
            key_word:true
        }, () => {
            this.getFilterClick();
        })
    }

     //获取筛选数据
     getFilterClick=()=>{
        const { keyWord } = this.state;
        const {city} = this.params;
        let model = {
            CityCode:city.Code,
            Keyword:keyWord,
        }
        this.showLoadingView();
        HotelService.HotelKeywordQuery(model).then(response => {
            this.hideLoadingView();
            if(response && response.success && response.data) {
                this.setState({
                    dataList:response.data
                })
            }else {
                this.toastMsg(response.message || '获取城市信息失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取城市信息失败');
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
            </View>
        )
    }
    _renderChooseItem = ({ item, index }) => {
        const {keyWord, hotelData,paymentArrival,paymentAdvance} = this.state;
        const {city,selectDate,longDay,JourneyId} = this.params;
        let hotel = item;
        hotel.CityCode = city.Code
        hotel.HotelCode = item.HotelId
        hotel.HotelName = item.Name
        return(
            <TouchableOpacity style={styles.listItemstyle}
                              onPress={()=>{
                                item.HotelId?
                                this.push('InterlHotelRoomList', {
                                  selectDate:selectDate,
                                  longDay:longDay, 
                                  hotel: hotel,
                                  city:city,
                                  paymentArrival:paymentArrival,
                                  paymentAdvance:paymentAdvance,
                                  JourneyId,
                                })
                                :
                                  this.setState({
                                      keyWord:item.Name
                                  },()=>{
                                      this._searchOrder();
                                  })
                              }}
            >
                <View style={{flexDirection:'row',alignItems:'center'}}>
                    <FontAwesome5 name={'building'} size={16} color={'red'}/>
                    <View style={{marginLeft:10}}>
                    {
                        item.Name.substring(0,keyWord.length)==keyWord?
                        <View style={{flexDirection:'row'}}>
                            <CustomText text={item.Name.substring(0,keyWord.length)} style={{color:Theme.theme}}/>
                            <CustomText text={item.Name.slice(keyWord.length)}/>
                        </View> :
                        <CustomText text={item.Name}/>
                    }
                       
                      <CustomText text={item.MallName} style={{marginTop:5, color:Theme.darkColor}}/>
                    </View>
                </View>
                <CustomText text={item.TypeDesc} style={{marginRight:10}}/>
            </TouchableOpacity>
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
        if(!data){return}
        const {hotelFacilitiesImages} = this.state;
        // let starArr = []
        // for (let i = 0; i<data.StarRate ; i++){
        //     starArr.push(i);
        // }
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
                      <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                        <View style={{width:110}}>
                            {Util.Parse.isChinese() ? <CustomText numberOfLines={2} style={{fontSize:14,fontWeight:'bold'}} text={data.HotelName} /> : <CustomText numberOfLines={2} style={{width:120}}  text={data.HotelNameEn} />}
                            {Util.Parse.isChinese() &&  (data.HotelName !== data.HotelNameEn)?  <CustomText numberOfLines={1} text={data.HotelNameEn} />:null}
                        </View>
                        <View>
                            <View style={{ flexDirection: 'row', marginRight: 5, }}>
                                    <CustomText style={{ color: Theme.theme, fontSize: 20 }} text={data.LocalLowRate == 0 ? '暂无报价' : (data.LocalLowRate)} />
                                    <CustomText style={{ fontSize: 12,color: Theme.theme,marginTop:8 }} text={data.LocalCurrenry} />
                                    <CustomText style={{ fontSize: 12, marginBottom:2,color: Theme.theme,marginTop:8 }} text='起' />
                            </View>
                            {
                                    data.LocalCurrenry==="CNY"?null:
                                    <CustomText style={{ color: Theme.theme, fontSize: 12, }} text={'≈'+data.LowRate+'CNY'} />
                            }
                        </View>
                      </View> 
                      <View style={{ marginTop: 0 }}>
                            {/* {
                              starArr.length>0?
                                <View style={{ flexDirection: 'row' }}>
                                    {  
                                    starArr.map(()=>{
                                        return<Image style={{height:14,width:14,marginRight:2,marginTop:5}} source={require('../../res/Uimage/hotelFloder/_star.png')}></Image>
                                    }) 
                                    }
                                </View>:null
                            } */}
                            <View style={{flexDirection:'row',marginTop:5}}>
                            {
                                groupText && data.AgreemetTags&&data.AgreemetTags.includes('3SAgreement')?
                                <CustomText text={groupText} style={{fontSize: 11, paddingHorizontal: 2 , color:'#fff',backgroundColor:Theme.theme,marginRight:2,borderRadius:2,padding:1 }}/>
                                :null
                            }
                            </View>
                            <View style={{ marginRight: 5, flexDirection: 'row',justifyContent:"space-between" }}>
                               <View>
                                {
                                    data.AgreemetTags && data.AgreemetTags.map(obj => {
                                        if (obj === '2SAgreement' || obj ==='价格计划2S协议') {
                                            return (<View style={{ marginRight:2 }}>
                                                <CustomText text={"FCM"} style={{fontSize: 11, paddingVertical:1,backgroundColor: Theme.theme, paddingHorizontal: 5 ,borderRadius:2, color:'#fff',marginTop:2 }} />
                                            </View>)
                                        }else if (obj === '3SAgreement' || obj ==='价格计划3S协议') {
                                            return (<View style={{ marginRight:2 }}>
                                                <CustomText text={Util.Parse.isChinese()?'协议':'Corp'} style={{ fontSize: 11, paddingVertical:1,backgroundColor: Theme.orangelableColor, paddingHorizontal: 5 ,borderRadius:2, color:'#fff',marginTop:2 }} />
                                            </View>)
                                        }else{
                                            return
                                        }
                                    })
                                }
                                {
                                this.props.highRisk && this.props.highRisk.Level>0 &&
                                    <Foundation name={'info'} style={{ marginRight: 5 }} size={20} color={this.props.highRisk.Level == 1 ? Theme.theme : this.props.highRisk.Level == 2 ? Theme.redColor : null} />
                                }
                               </View>
                               
                            </View>
                            <View style={{flexDirection:'row',alignItems:'stretch',marginTop:6}}>
                                <EvilIcons name={'location'} style={{ fontSize: 17, color: 'gray',marginLeft:-3}} ></EvilIcons>
                                <CustomText numberOfLines={2} style={{ fontSize: 12, color: 'gray'  }} text={data.Address} />
                            </View>
                            <View style={{flexDirection:'row',marginTop:5,borderRadius:2}}>
                                {
                                    data.IsAgreement ?
                                        <View style={{ }}>
                                            <CustomText text='专享协议' style={{ fontSize: 11, paddingVertical:1,backgroundColor: Theme.orangelableColor, paddingHorizontal: 5 ,borderRadius:2, color:'#fff'}} />
                                        </View>
                                    :null
                                }
                            </View>
                            <View style={{ flexDirection: 'row', marginTop: 1 }}>
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
            <View style={{  backgroundColor: 'white', height: 45, flexDirection: 'row', borderBottomColor: Theme.lineColor, borderBottomWidth: 0.5 }}>
                <TouchableHighlight style={styles.filter_item} underlayColor='transparent' onPress={this._bottomBtnClickAtIndex.bind(this, 1)}>
                    <View style={styles.filter_View}>
                        <CustomText text='默认排序' style={{ color: isShowSort ? Theme.theme : Theme.annotatedFontColor }} />
                        <AntDesign name={isShowSort ? 'caretup' : 'caretdown'} size={8} color={isShowSort ?Theme.theme:'gray'} style={{ marginLeft: 3 }} />
                    </View>
                </TouchableHighlight >
                <TouchableHighlight style={styles.filter_item} underlayColor='transparent' onPress={this._bottomBtnClickAtIndex.bind(this, 2)}>
                    <View style={styles.filter_View}>
                        <CustomText text='价格排序' style={{ color: isShowStart ? Theme.theme : Theme.annotatedFontColor }} />
                        <AntDesign name={isShowStart ? 'caretup' : 'caretdown'} size={8} color={isShowStart ?Theme.theme:'gray'} style={{ marginLeft: 3 }} />
                    </View>
                </TouchableHighlight>
            </View >
        )
    }


    _renderOtherSelect = () => {
        const { MatchTravelRule, paymentArrival, paymentAdvance, Breakfast, FreeCancel, InstantConfirmation, IsAgreement, SelfOwnHotel,IsCustomerAgreement } = this.state;
        const { customerInfo } = this.params;
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center',padding: 10,backgroundColor:'#fff',marginBottom:6 }}>
                <ScrollView showsHorizontalScrollIndicator={false} horizontal={true}>
                <View style={[styles.filter_other_view, { backgroundColor: MatchTravelRule ? Theme.greenBg : 'white',borderColor:MatchTravelRule ?Theme.theme:Theme.lineColor  }]}>
                    <CustomText text='符合城市标准' style={{ fontSize: 12, color: MatchTravelRule ? Theme.theme : Theme.annotatedFontColor }} onPress={this._otherFilter.bind(this, 0)} />
                </View>
                {/* 
                <View style={[styles.filter_other_view, { backgroundColor: Breakfast ? Theme.theme : "white" }]}>
                    <CustomText text='含早' style={{ fontSize: 12, color: Breakfast ? 'white' : Theme.annotatedFontColor }} onPress={this._otherFilter.bind(this, 1)} />
                </View>
                <View style={[styles.filter_other_view, { backgroundColor: FreeCancel ? Theme.theme : 'white' }]}>
                    <CustomText text='免费取消' style={{ fontSize: 12, color: FreeCancel ? 'white' : Theme.annotatedFontColor }} onPress={this._otherFilter.bind(this, 2)} />
                </View>
                <View style={[styles.filter_other_view, { backgroundColor: InstantConfirmation ? Theme.theme : "white" }]}>
                    <CustomText text='立即确认' style={{ fontSize: 12, color: InstantConfirmation ? 'white' : Theme.annotatedFontColor }} onPress={this._otherFilter.bind(this, 3)} />
                </View> */}
                {/* <View style={[styles.filter_other_view, { backgroundColor: IsAgreement ? Theme.theme : 'white' }]}>
                    <CustomText text='专享协议' style={{ fontSize: 12, color: IsAgreement ? 'white' : Theme.annotatedFontColor }} onPress={this._otherFilter.bind(this, 4)} />
                </View> */}
                {
                    customerInfo.Setting.HotelCorpPaymentType != 2 ?
                    <View style={[styles.filter_other_view, { backgroundColor: paymentArrival ? Theme.greenBg : 'white',borderColor:paymentArrival ?Theme.theme:Theme.lineColor }]}>
                        <CustomText text='到付' style={{fontSize: 12, color: paymentArrival ? Theme.theme : Theme.annotatedFontColor}} onPress={this._otherFilter.bind(this, 6)} />
                    </View>
                    : null
                }
                {
                    customerInfo.Setting.HotelCorpPaymentType != 1 ?
                    <View style={[styles.filter_other_view, { backgroundColor: paymentAdvance ? Theme.greenBg : 'white',borderColor:paymentAdvance ?Theme.theme:Theme.lineColor }]}>
                        <CustomText text='预付' style={{ fontSize: 12, color: paymentAdvance ? Theme.theme : Theme.annotatedFontColor}} onPress={this._otherFilter.bind(this, 7)} />
                    </View>
                    : null
                }
                {/* <View style={[styles.filter_other_view, { backgroundColor: SelfOwnHotel ? Theme.theme : "white" }]}>
                    <CustomText text='FCM特惠' style={{ fontSize: 12, color: SelfOwnHotel ? 'white' : Theme.annotatedFontColor }} onPress={this._otherFilter.bind(this, 5)} />
                </View> */}
                {
                    <View style={[styles.filter_other_view, { backgroundColor: IsCustomerAgreement ? Theme.greenBg : 'white',borderColor:IsCustomerAgreement ?Theme.theme:Theme.lineColor }]}>
                        <CustomText text='协议酒店' style={{ fontSize: 12, color: IsCustomerAgreement ? Theme.theme : Theme.annotatedFontColor }} onPress={this._otherFilter.bind(this, 8)} />
                    </View> 
                }
                </ScrollView>
            </View>
        )
    }

    render() {
        if (this._navigationHeaderView) {
            this._navigationHeaderView.titleView = this._titleHeaderView();
        }
        return super.render();
    }

}

const getStatePorps = state => ({
    highRisk:state.highRisk.highRisk,
    compReferenceEmployee: state.compReferenceEmployee.ReferenceEmployee,//综合订单出差人选定参考出差人信息
    comp_userInfo:state.comp_userInfo,
    apply:state.apply.apply,
})
export default connect(getStatePorps)(InterHotelListScreen);

let SortCn = ['推荐排序', '价格从低到高', '价格从高到低', '距离从近到远'];
let SortEn = ['Default', 'PriceAsc', 'PriceDesc', 'distanc'];
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
    alertStyle:{
        width: '80%', 
        backgroundColor:'#fff',
        borderRadius:8,
        padding:10,
        // height:125
        // marginTop:-250
    },
    boxStyle:{
        flexDirection:'row',
        alignItems:'center',
        // backgroundColor:'#ffa'
    },
    titleStyle:{
        height:30,
        width:1,
        backgroundColor:'gray'
    },
    listItemstyle:{
        flexDirection:'row',
        borderBottomWidth:0.5,
        borderColor:Theme.lineColor,
        padding:10,
        justifyContent:'space-between'
    }
})
