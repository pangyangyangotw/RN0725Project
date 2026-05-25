
import React from 'react';
import {
    View,
    FlatList,
    Image,
    Text,
    StyleSheet,
    TouchableHighlight,
    TouchableOpacity,
    DeviceEventEmitter
} from 'react-native';
import SuperView from '../../super/SuperView';
import ViewUtil from '../../util/ViewUtil';
import Util from '../../util/Util';
import I18nUtil from '../../util/I18nUtil';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ApplicationService from '../../service/ApplicationService';
import action from '../../redux/action';
import { connect } from 'react-redux';
import CommonService from '../../service/CommonService';
import NavigationUtils from '../../navigator/NavigationUtils';

class ApplicationSelectScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '选择申请单'
        }
        this._tabBarBottomView = {
            bottomInset: true,
        }
        this.state = {
            dataList: [],
            isLoading: true,
            isLoadingMore: false,
            isNoMoreData: false,
            page: 1,
            selectApplication: null,
            goCityDisplay:null,
            arrivalCityDisplay:null,
            BeginTime:null,
            EndTime:null,
            selectApply:'',
            selectApplyItem:null,
        }
    }

    componentDidMount() {
        this._loadList();
    }

    _loadList = () => {
        let model = {
            Query: {
                Kerword: '',
                Status: 1,
                SerialNumber:this.params.SerialNumber,
                IsOnlyCreate:true,
            },
            Pagination: {
                PageIndex: this.state.page,
                PageSize: 40
            }
        }
        ApplicationService.travelApplyList(model).then(response => {
            if (response && response.success) {
                if (response.data && response.data.ListData && response.data.ListData.length !=0) {
                    this.state.dataList = this.state.dataList.concat(response.data.ListData);
                }
                if (response.data.TotalRecorder <= this.state.dataList.length) {
                    this.state.isNoMoreData = true;
                }
                this.setState({
                    isLoading: false,
                    isLoadingMore: false
                })
            } else {
                this._detailLoadFail();
                this.toastMsg(response.message || '获取申请单列表失败');
            }
        }).catch(error => {
            this._detailLoadFail();
            this.toastMsg(error.message || '获取数据异常');
        })
    }
    //错误处理
    _detailLoadFail = () => {
        if (this.state.isLoadingMore) {
            this.state.page--;
        }
        this.setState({
            isLoading: false,
            isLoadingMore: false
        })
    }

    _selectTravelItem2 = (item, data) => {
        this._commonCity1(item.Departure);
        this._commonCity2(item.Destination);
        this.setState({
            BeginTime: item.BeginTime,
            EndTime: item.EndTime,
            selectApply: item.Id,
            selectApplication: data,
            selectApplyItem:item
        })
    }

    _selectTravelItem = (data) => {
        if(data.Destination&&data.Destination.DepartureList&&data.Destination.DepartureList.length>0){
            this._commonCity1(data.Destination.DepartureList[0].Name, data.Destination.DepartureList[0].Code);
            this._commonCity2( data.Destination.DestinationList[0].Name, data.Destination.DepartureList[0].Code);
        }
        if(data.Destination){
            let dList = data.Destination
            this.setState({
                BeginTime: dList.BeginTime,
                EndTime: dList.EndTime
            })
        }
        this.setState({
            selectApplication: data
        })
    }
    /** 
     *  去预定
     */
    _goToOrderSure = (index) => {
        // const { customerInfo,andFrom,compMassId } = this.params;
        // if (index === 1) {
            
        //     if(andFrom==='compDetail'){
        //         this.push('CompDetailScreen',{
        //             orderId:compMassId,
        //         });
        //     }else{
        //         if (customerInfo && customerInfo.Setting && ((customerInfo.Setting.OrderPageConfig && customerInfo.Setting.OrderPageConfig.IsShowExternalTravelApply) || customerInfo.Setting.IsApplyOnly)) {
        //             this.toastMsg('请选择申请单');
        //             return;
        //         }else{
        //             this.props.setApply();
        //             DeviceEventEmitter.emit('refreshaaa', {test:1});
        //             NavigationUtils.pop(this.props.navigation);
        //         }
        //     }
            
        // } else if(index === 2) {
            if (!this.state.selectApplication) {
                this.toastMsg('请选择申请单');
                return;
            }
            this._fromOrderToSure();
        // }
    }

    _fromOrderToSure = () => {
        const { customerInfo ,andFrom,from,callBack,SerialNumber} = this.params;
        const { selectApplication,arrivalCityDisplay,goCityDisplay,BeginTime,EndTime,selectApplyItem } = this.state;
        selectApplication.selectApplyItem = selectApplyItem
        if(andFrom==='compDetail'){
            if(from=='hotel'){
                let bCategory;
                if(!(selectApplyItem&&selectApplyItem.BusinessCategory&4)){
                    bCategory=true
                }
                this.push('HotelSearchIndex', { 
                    isIntl: false,
                    selectTap:4,
                    noApply:false,
                    SerialNumber:SerialNumber,
                    arrivalCityDisplay:arrivalCityDisplay,
                    bCategory,
                    BeginTime:BeginTime,
                    EndTime:EndTime
                });
            }else if(from=='intlHotel'){
                let IsJourneyType = customerInfo&&customerInfo.Setting.FlightTravelApplyConfig.IsJourneyType 
                let bCategory;
                if(!(selectApplyItem&&selectApplyItem.BusinessCategory&4)){
                    bCategory=true
                }
                this.push('HotelSearchIndex', { 
                    isIntl: true ,
                    selectTap:6,
                    noApply:false,
                    SerialNumber:SerialNumber,
                    arrivalCityDisplay:arrivalCityDisplay,
                    bCategory,
                    BeginTime:BeginTime,
                    EndTime:EndTime
                });

            }
        }
        this.props.setApply(selectApplication);
        if(!andFrom){
            callBack(selectApplication,arrivalCityDisplay,goCityDisplay,BeginTime,EndTime,selectApplyItem);
            this.pop();
        }
    }

     //分开写 写两个 _commonCity
     _commonCity1 = (item) =>{
        let model = {
            Keyword: item,
            Domestic:''
        }
        CommonService.CommonCity(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data && response.data) {
                    response.data.map((obj)=>{
                        if(obj.Name == item.replace('市','') ){
                           this.setState({
                            goCityDisplay:obj
                           })
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
    _commonCity2 = (item) =>{
        let model = {
            Keyword: item,
            Domestic:''
        }
        CommonService.CommonCity(model).then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                if (response.data && response.data) {
                    response.data.map((obj)=>{
                        if(obj.Name == item.replace('市','') ){
                            this.setState({
                                arrivalCityDisplay:obj
                            })
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

    _renderItem = ({ item: data, index }) => {
        const { from } = this.params;
        let JourneyIntro;
        let depObj;
        let text;
        let returnObj;
        let time;
        let arr = data.CategoryIntroCn.split('、')
        let gettrain=false; 
        let getflight=false; 
        let getintlFlight=false; 
        let gethotel=false; 
        let getintlHotel=false; 
        if(data.TravelApplyMode==2){
            if (!data.Destination) return null;
            JourneyIntro = data.JourneyIntro
            depObj = data.Destination;
            let beginTime = data.Destination.BeginTime.slice(0,10)
            let endTime = data.Destination.EndTime.slice(0,10)
            time = `${beginTime}${I18nUtil.translate('至')}${endTime}`
        }else{
            if (!data.JourneyList) return null;
            depObj = data.JourneyList[0];
            depObj.DepartureTime = Util.Date.toDate(depObj.BeginTime);
            let beginTime=depObj.DepartureTime?.format('MM-dd')
            returnObj = data.JourneyList[data.JourneyList.length - 1];
            returnObj.ReturnTime = Util.Date.toDate(returnObj.EndTime);
            let endTime=returnObj.ReturnTime?.format('MM-dd')
            time = `${beginTime}${I18nUtil.translate('至')}${endTime}`
        } 
        if(arr.indexOf('国内机票')!= -1){
            getflight=true
        } 
        if(arr.indexOf('火车票')!= -1){
            gettrain=true
        } 
        if(arr.indexOf('港澳台及国际机票')!= -1){
            getintlFlight=true
        } 
        if(arr.indexOf('国内酒店')!= -1){
            gethotel=true
        } 
        if(arr.indexOf('港澳台及国际酒店')!= -1){
            getintlHotel=true
        }  

        let flightCategory = 1;
        let trainCategory = 2;
        let intlFlightCategory = 8;
        let hotelCategory = 4;
        let intlHotelCategory = 16;
        return(
            from =='flight'?
            getflight?
            this._itemView(JourneyIntro,data,time,text,returnObj,flightCategory):null
            :
            from =='train'?
            gettrain?
            this._itemView(JourneyIntro,data,time,text,returnObj,trainCategory):null
            :
            from =='intlFlight'?
            getintlFlight?
            this._itemView(JourneyIntro,data,time,text,returnObj,intlFlightCategory):null
            :
            from =='hotel'?
            gethotel?
            this._itemView(JourneyIntro,data,time,text,returnObj,hotelCategory):null
            :
            from =='intlHotel'?
            getintlHotel?
            this._itemView(JourneyIntro,data,time,text,returnObj,intlHotelCategory):null
            :
            from =='creatComp'?
            this._itemView(JourneyIntro,data,time,text,returnObj,null)
            :
            null
        )
    }

    _showJourneyList = (data) => {
        data.showJourneyList = !data.showJourneyList
        this.setState({})
    }

    _itemView = (JourneyIntro,data,time,text,returnObj,Category)=>{
        const {selectApply} = this.state;
        const { from } = this.params;
        return(
            data.JourneyList && data.TravelApplyMode!=2?
            <View style={{ backgroundColor: 'white', margin: 10, padding: 10 }}>
                 <View style={{ flexDirection: 'row',justifyContent:'space-between', alignItems: 'center'}}>
                    <View style={{ flexDirection: 'row', alignItems: 'center',marginTop: 10 }}>
                        <Image style={{ width: 18, height: 18, tintColor: Theme.theme }} source={require('../../res/Uimage/bag.png')} />
                        <CustomText style={{  color:Theme.commonFontColor, marginLeft:5 }} text={data.SerialNumber} />
                    </View>
                </View>
                <View style={{ marginTop: 5, height: 1, backgroundColor: Theme.lineColor }}></View>
               {

                 data.JourneyList.map((item)=>{
                    return(
                        !Category || item.BusinessCategory&Category?
                        <TouchableOpacity onPress={this._selectTravelItem2.bind(this, item, data)} style={{justifyContent:'space-between',flexDirection:'row', alignItems: 'center',marginTop: 15,}}>
                            <View style={{ width: 260}}>
                                <CustomText style={{  }} text={I18nUtil.tranlateInsert('出差日期：{{noun}}', I18nUtil.translate(item.JourneyIntro))}></CustomText>
                                {/* <CustomText style={{ marginTop:5 }} text={I18nUtil.tranlateInsert('出差城市：{{noun}}', I18nUtil.translate(item.JourneyIntro))}></CustomText> */}
                                <CustomText style={{ marginTop:5 }} text={I18nUtil.tranlateInsert('出差人员：{{noun}}', I18nUtil.translate(data.TravellerIntro))}></CustomText>
                            </View>
                            <MaterialIcons
                                name={selectApply==item.Id?'radio-button-checked': 'radio-button-unchecked'}
                                size={20}
                                color={selectApply==item.Id?Theme.theme:Theme.promptFontColor}
                            />
                        </TouchableOpacity>:null
                    )
                 })
               } 
            </View>
            :
            <TouchableHighlight underlayColor='transparent' onPress={this._selectTravelItem.bind(this, data)}>
                <View style={{ backgroundColor: 'white', margin: 10, padding: 10 }}>
                    <CustomText text={data.TravellerIntro} />
                    <View style={{ marginTop: 5, height: 1, backgroundColor: Theme.lineColor }}></View>
                    <View style={{ marginTop: 10, flexDirection: 'row' }}>
                        <View style={{ marginLeft: 10, flex: 1 }}>
                            {data.ExternalCode?<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                <AntDesign name={'filetext1'} size={26} color={Theme.theme} />
                                <CustomText style={{ marginLeft: 10 }} text={data.ExternalCode} />
                            </View>:null}
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <AntDesign name={'Safety'} size={26} color={Theme.theme} />
                                <CustomText style={{ marginLeft: 10 }} text={data.SerialNumber} />
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                <Image style={{ width: 26, height: 26, tintColor: Theme.theme }} source={require('../../res/image/application_city.png')} />
                                <CustomText style={{ marginLeft: 10,width:global.screenWidth-80 }} text={data.JourneyIntro} />
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                <AntDesign name={'clockcircleo'} size={26} color={Theme.theme} />
                                <Text style={{ marginLeft: 10 }}>{time}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                <AntDesign name={'questioncircleo'} size={26} color={Theme.theme} />
                                <CustomText style={{ marginLeft: 10 }} text={data.TravelReason} />
                            </View>
                        </View>
                        <View style={{ justifyContent: 'center' }}>
                            {
                                this.state.selectApplication && this.state.selectApplication.Id === data.Id ?
                                    <AntDesign name={'checkcircle'} size={26} color={Theme.theme} />
                                    : null
                            }
                        </View>
                    </View>
                </View>
            </TouchableHighlight>
        )
    }
    renderBody() {
        const { dataList, isLoadingMore, isNoMoreData, isLoading } = this.state;
        return (
            <View style={{ flex: 1 }}>
                <FlatList
                    data={dataList}
                    refreshControl={ViewUtil.getRefreshControl(isLoading, () => {
                        this.setState({
                            isLoading: true,
                            isNoMoreData: false,
                            isLoadingMore: false,
                            page: 1,
                            dataList: []
                        }, () => {
                            this._loadList();
                        })
                    })}
                    renderItem={this._renderItem}
                    ListFooterComponent={ViewUtil.getRenderFooter(isLoadingMore, isNoMoreData)}
                    keyExtractor={(item, index) => String(index)}
                    onEndReachedThreshold={0.1}
                    onEndReached={() => {
                        setTimeout(() => {
                            if (this.canLoad && !isNoMoreData && !isLoadingMore && !isLoading) {
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
                    onMomentumScrollBegin={() => {
                        this.canLoad = true;
                    }}
                />
                {/* <View style={styles.bottomView}>
                    <TouchableHighlight underlayColor='transparent' onPress={this._goToOrderSure.bind(this, 1)} style={styles.nextBtn}>
                        <CustomText style={{ color: 'white' }} text='跳过' />
                    </TouchableHighlight>
                    <TouchableHighlight underlayColor='transparent' onPress={this._goToOrderSure.bind(this, 2)} style={styles.nextBtn}>
                        <CustomText style={{ color: 'white' }} text='下一步' />
                    </TouchableHighlight>
                </View> */}
                 {ViewUtil.getThemeButton('确认',this._goToOrderSure)}
            </View>
        )
    }
}

const getAction = dispatch => ({
    setApply: (value) => dispatch(action.applySet(value)),
})
export default connect(null,getAction)(ApplicationSelectScreen);

const styles = StyleSheet.create({
    bottomView: {
        height: 40,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    nextBtn: {
        marginHorizontal: 20,
        flex: 1,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Theme.theme
    },
})