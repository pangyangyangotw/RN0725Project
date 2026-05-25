import React from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    TouchableHighlight,
    Image,
    Text,
} from 'react-native';
import SuperView from '../../super/SuperView';
import I18nUtil from '../../util/I18nUtil';
import CustomText from '../../custom/CustomText';
import { FlatList } from 'react-native-gesture-handler';
import Theme from '../../res/styles/Theme';
import { connect } from 'react-redux';
import TrainService from '../../service/TrainService';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Util from '../../util/Util';
import NetworkFaildView from '../../custom/NetWorkFaildView';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ViewUtil from '../../util/ViewUtil'
const dcCodes = ['D', 'G', 'GD', 'C', 'XGZ'];
class TrainNumListScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: `备选车次推荐`,
            leftButton:ViewUtil.getLeftBackButton(this._clickLeft)
        }
        this.state = {
            multSelectItems:this.params.multSelectItems?this.params.multSelectItems:[],//选择后的车次
            setSelects:this.params.setSelects1?this.params.setSelects1:[],//选择车次的席位数组
            setType:this.params.setType?this.params.setType:[],//席位类型
            TrainDiedline:this.params.TrainDiedline?this.params.TrainDiedline:[],//火车出发时间
            TrainPrice:[],//选择的车次的价钱
        }
    }
    _clickLeft = () =>{
        const { callBack } = this.params;
        const {multSelectItems, setType, TrainDiedline, TrainPrice, setSelects} = this.state;
        function sortDownDate(a, b) {
            return b-a;
        }
        TrainPrice&&TrainPrice.sort(sortDownDate);//给选择的抢票日期排序
        let returnPrice = TrainPrice&&TrainPrice[0];
        callBack(multSelectItems,setType,TrainDiedline,setSelects);
        this.pop();

    }
    /**选择每一个车次的点击事件 */
    _onClick = (item,index) => {
        const{multSelectItems,setSelects,TrainDiedline,TrainPrice}=this.state;
        if(multSelectItems.indexOf(item.train_code) > -1){
            setSelects.splice(multSelectItems.indexOf(item.train_code), 1);
            var resultArr=multSelectItems;
            resultArr.splice(multSelectItems.indexOf(item.train_code), 1);
            //处理出发时间
            var resultTimeArr=TrainDiedline;
            resultTimeArr.splice(TrainDiedline.indexOf(item.start_time), 1);
            //处理票价
            var resultTrainPrice=TrainPrice;
            resultTrainPrice.splice(TrainPrice.indexOf(item.start_time), 1);
            var resultSelectsArr=setSelects;
            this.setState({
                multSelectItems:resultArr,
                setSelects:resultSelectsArr,
                TrainDiedline:resultTimeArr,
                TrainPrice:resultTrainPrice
            })
            
        }else{
            //处理车次
            multSelectItems.push(item.train_code);
            var resultArr;
            resultArr = multSelectItems.filter(function (item, index, self) {
                return self.indexOf(item) == index;
            });
            this.setState({
                multSelectItems:resultArr
            })
            //处理坐席
            setSelects.push(item);//加入item为了获取车票席位（一等座、二等座...）
            var setArr;
            setArr = setSelects.filter(function (item, index, self) {
                return self.indexOf(item) == index;
            });
            this.setState({
                setSelects:setArr
            })
            //处理时间
            TrainDiedline.push(item.start_time);
            var timeArr;
            timeArr = TrainDiedline.filter(function (item, index, self) {
                return self.indexOf(item) == index;
            });
            this.setState({
                TrainDiedline:timeArr
            })
            //处理火车票价钱
            TrainPrice.push(item.displayPrice);
            var priceArr;
            priceArr = TrainPrice.filter(function (item, index, self) {
                return self.indexOf(item) == index;
            });
            this.setState({
                TrainPrice:priceArr
            })
            

        } 
        var setarr=[];
        setSelects.map((objs)=>{
            setarr.push(objs.ticketTypes)
        })
        var arr =[]
        setarr.map((objs)=>{
            objs.map((obj)=>{
                arr.push([obj.seat,obj.checkSeat])
            })
        })
        let obj = {};
        let newArr = arr.filter(function (item, index, arr) {
                return obj.hasOwnProperty(typeof item + JSON.stringify(item)) ? false : (obj[typeof item + JSON.stringify(item)] = true);
        });
        this.setState({
            setType:newArr
        })  
    }
    /**
     * 行内容
     */
    _renderItem = ({ item,index}) => {
        getMinPrice(item);
        return (
            <TouchableHighlight style={{ marginBottom: 2, backgroundColor: 'white', padding: 5 }} onPress={this._onClick.bind(this, item,index)} underlayColor='transparent'>
            <View>
                <View style={{ flexDirection: 'row', padding: 5 }}>
                    <View style={{ flex: 2, justifyContent: 'space-around', height: 80 }}>
                        <View style={{ flexDirection: 'row', alignItems: "center" }}>
                            <MaterialIcons name={'access-time'} size={18} color={'#999'} />
                            <CustomText style={{ marginLeft: 5, fontSize: 14, color: '#999' }} text={item.runTimeDesc} />
                        </View>
                        <CustomText style={{ fontSize: 18 }} text={item.start_time} />
                        <View style={{ flexDirection: 'row' }}>
                            <CustomText style={{ fontSize: 16 }} text={item.arrive_time} />
                            <View style={{ width: 18, marginLeft: 5 }}>
                                <CustomText style={{ color: '#999', fontSize: 12 }} text={item.arrive_days > 0 ? '+' + item.arrive_days : ''} />
                            </View>
                        </View>
                    </View>
                    <View style={{ flex: 2, justifyContent: 'space-around', height: 80 }}>
                        <View style={{ flexDirection: 'row' ,alignItems:'center'}}>
                            <CustomText style={{ fontSize: 14, color: '#999' }} text={item.train_code} />
                          {item.is_support_card == 1? <Image style={{marginLeft:5}} source={require('../../res/image/ID_Identity.png')}/>:null} 
                        </View>

                        <CustomText style={{ fontSize: 18 }} numberOfLines={1} text={item.from_station_name} />
                        <CustomText style={{ fontSize: 16 }} numberOfLines={1} text={item.to_station_name} />
                    </View>
                    <View style={{ flex: 1, justifyContent:'space-around' }}>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-end' }}>
                            <CustomText style={styles.priceAidFont} text='起' />
                            <CustomText style={styles.priceFont} text={item.displayPrice} />
                            <CustomText style={styles.priceAidFont} text='¥' />
                        </View>
                        <View style={{alignItems: 'flex-end'}}>
                            {/* <View style={{width:25,height:25,backgroundColor:'green',alignItems: 'flex-end'}}/> */}
                            {
                                this.state.multSelectItems.map((items,index)=>{
                                    if(item.train_code==items){
                                        return(
                                            <AntDesign
                                            name={'check'}
                                            size={28}
                                            key={index}
                                            color={Theme.theme}
                                            />
                                        )
                                    }
                                })                
                            } 
                            {/* <MaterialIcons
                                // name={this.state.isReceiveNoSeat ? 'check-box' : 'check-box-outline-blank'}
                                name={'check-box'}
                                size={28}
                                color={'red'}
                            /> */}
                        </View>
                       
                    </View>
                </View>
                <View style={{ alignItems: 'center' }}>
                    <Image style={{ marginHorizontal: 10, width: '100%', height: 1 }} source={require('../../res/image/dotted_line.png')} />
                </View>
                <View style={{ flexDirection: 'row', marginTop: 5, flex: 1, flexWrap: 'wrap' }}>
                    {
                        item.ticketTypes && item.ticketTypes.map((obj, index) => {
                            return (<View style={{ flexDirection: 'row', marginRight: 20, alignItems: 'center' }} key={index}>
                                <CustomText text={obj.seat} style={styles.aidFont} />
                                <Text style={styles.aidFont}>{isNaN(obj.seatCount) ? 0 : obj.seatCount}</Text>
                                <CustomText text='张' style={styles.aidFont} />
                            </View>)
                        })
                    }
                </View>
            </View>
        </TouchableHighlight>
        )
    }
    _renderError = () => {
        const { showErrorMessage } = this.state;
        return (
            <View style={{ flex: 1 }}>
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
        const { recommendTrain } = this.params;
        return (
            <View style={{ flex: 1 }}>
                {recommendTrain?
                        <FlatList
                            data={recommendTrain}
                            renderItem={this._renderItem}
                            showsVerticalScrollIndicator={false}
                            keyExtractor={(item, index) => String(index)}
                        />:
                        <View style={{justifyContent:'center',alignContent:'center'}}>
                            <CustomText text={'没有您要找的数据'}/>
                        </View>
                        
                }
            </View>
        )
    }
}
function getMinPrice(item) {
    item.ticketTypes = [];
    item.runTimeDesc = item.run_time.replace(/[:：]/g, I18nUtil.translate('时')) + I18nUtil.translate('分');
    let check = item.IsCheckSeat == 1 && item.TrainSerat;
    if (dcCodes.includes(item.train_type)) {
        // item.trainType = '高铁动车';
    } else {
        // item.trainType = '普通列车';
    }
    if (+item.yz_price > 0) {
        item.ticketTypes.push({
            seat: '硬座',
            seatCount: !isNaN(item.yz_num) || item.yz_num ? (+item.yz_num) : 0,
            price: +item.yz_price,
            checkSeat: check ? check.is_checkyz_num : 1
        });
    }
    if (+item.wz_price > 0) {
        item.ticketTypes.push({
            seat: '无座',
            seatCount: !isNaN(item.wz_num) || item.wz_num ? (+item.wz_num) : 0,
            price: +item.wz_price,
            checkSeat: check ? check.is_checkwz_num : 1
        });
    }
    if (+item.rz_price > 0) {
        item.ticketTypes.push({
            seat: '软座',
            seatCount: !isNaN(item.rz_num) || item.rz_num ? (+item.rz_num) : 0,
            price: +item.rz_price,
            checkSeat: check ? check.is_checkrz_num : 1
        });
    }
    if (+item.yw_price > 0) {
        item.ticketTypes.push({
            seat: '硬卧',
            seatCount: !isNaN(item.yw_num) || item.yw_num ? (+item.yw_num) : 0,
            price: +item.ywx_price,
            checkSeat: check ? check.is_checkyw_num : 1
        });
    }
    if (+item.rw_price > 0) {
        item.ticketTypes.push({
            seat: '软卧',
            seatCount: !isNaN(item.rw_num) || item.rw_num ? (+item.rw_num) : 0,
            price: +item.rwx_price,
            checkSeat: check ? check.is_checkrw_num : 1
        });
    }
    if (+item.dw_price > 0) {
        item.ticketTypes.push({
            seat: '动卧',
            seatCount: !isNaN(item.dw_num) || item.dw_num ? (+item.dw_num) : 0,
            price: +item.dwx_price,
            checkSeat: check ? check.is_checkdw_num : 1
        })
    }
    if (+item.gjrw_price > 0) {
        item.ticketTypes.push({
            seat: '高级软卧',
            seatCount: !isNaN(item.gjrw_num) || item.gjrw_num ? (+item.gjrw_num) : 0,
            price: +item.gjrw_price,
            checkSeat: check ? check.is_checkgjrw_num : 1
        });
    }
    if (+item.edz_price > 0) {
        item.ticketTypes.push({
            seat: '二等座',
            seatCount: !isNaN(item.edz_num) || item.edz_num ? (+item.edz_num) : 0,
            price: +item.edz_price,
            checkSeat: check ? check.is_checkedz_num : 1
        });
    }
    if (+item.ydz_price > 0) {
        item.ticketTypes.push({
            seat: '一等座',
            seatCount: !isNaN(item.ydz_num) || item.ydz_num ? (+item.ydz_num) : 0,
            price: +item.ydz_price,
            checkSeat: check ? check.is_checkydz_num : 1
        });
    }
    if (+item.edw_price > 0) {
        item.ticketTypes.push({
            seat: '二等卧',
            seatCount: !isNaN(item.edw_num) || item.edw_num ? (+item.edw_num) : 0,
            price: +item.edwx_price,
            checkSeat: check ? check.is_checkedw_num : 1
        });
    }
    if (+item.ydw_price > 0) {
        item.ticketTypes.push({
            seat: '一等卧',
            seatCount: !isNaN(item.ydw_num) || item.ydw_num ? (+item.ydw_num) : 0,
            price: +item.ydwx_price,
            checkSeat: check ? check.is_checkydw_num : 1
        });
    }
    if (+item.swz_price > 0) {
        item.ticketTypes.push({
            seat: '商务座',
            seatCount: !isNaN(item.swz_num) || item.swz_num ? (+item.swz_num) : 0,
            price: +item.swz_price,
            checkSeat: check ? check.is_checkswz_num : 1
        });
    }
    if (+item.tdz_price > 0) {
        item.ticketTypes.push({
            seat: '特等座',
            seatCount: !isNaN(item.tdz_num) || item.tdz_num ? (+item.tdz_num) : 0,
            price: +item.tdz_price,
            checkSeat: check ? check.is_checktdz_num : 1
        });
    }
    if (+item.yxydz_price > 0) {
        item.ticketTypes.push({
            seat: '优选一等座',
            seatCount: !isNaN(item.yxydz_num) || item.yxydz_num ? (+item.yxydz_num) : 0,
            price: +item.yxydz_price,
            checkSeat: check ? check.is_checktdz_num : 1
        });
    }
    if (item.ticketTypes.length > 0) {
        let minPriceTicket = item.ticketTypes[0];
        item.displaySeat = minPriceTicket.seat;
        item.displayPrice = isNaN(minPriceTicket.price) ? 0 : minPriceTicket.price;
        item.displayStatus = getStatusDesc(minPriceTicket.seatCount);
    } else {
        item.displaySeat = '无座';
        item.displayPrice = 0;
        item.displayStatus = '已售完';
    }
}
//获取售票状态
getStatusDesc = (number) => {
    if (!number) return '无票';
    var tmpNum = Number(number);
    if (isNaN(tmpNum) || tmpNum < 1) {
        return '无票';
    } else if (tmpNum > 20) {
        return '充足';
    } else {
        return number + '张';
    }
}

export default TrainNumListScreen;

const styles = StyleSheet.create({
    header: {
        height: 50,
        backgroundColor: Theme.theme,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center'
    },
     /**
   * 主色字体
   */
    mainFont: {
        fontSize: 15,
        color: '#333'
    },
    /**
     * 价格字体
     */
    priceFont: {
        fontSize: 15,
        color: '#ff7a03'
    },
    /**
    * 辅助字体
    */
    aidFont: {
        fontSize: 12,
        color: '#999'
    },
    /**
    * 价格辅助字体
    */
    priceAidFont: {
        fontSize: 12,
        color: '#ff7a03'
    },
})