import React from 'react';
import {
    View,
    ScrollView,
    TouchableHighlight,
    StyleSheet,
} from 'react-native';
import SuperView from '../../super/SuperView';
import HotelService from '../../service/HotelService';
import Theme from '../../res/styles/Theme';
import CustomText from '../../custom/CustomText';
import Util from '../../util/Util';
import ViewUtil from '../../util/ViewUtil';
import AntDesign from 'react-native-vector-icons/AntDesign';
export default class HotelFilterScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '筛选'
        }
        this._tabBarBottomView = {
            bottomInset: true
        }

        this.state = {
            filterData: null,
            currentIndex: 11,
            locationsIndex: 0,
            brandIndex: 0,
            Location: this.params.Location,
            District: this.params.District,
            Brand: this.params.Brand,
            brandData: null,
            Address:this.params.Address,
            Radius:null

        }
    }
    componentDidMount() {
        this.showLoadingView();
        const filtersPromise = HotelService.HotelCityFilters({ CityCode: this.params.CityCode });
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
                        this.setState({
                            filterData: response.data
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
    _rowClick = (obj) => {
        const { callBack } = this.params;
        callBack(obj);
        this.pop();
    }
    //选择左边
    _selectLeft = (index) => {
        this.setState({
            currentIndex: index
        })
    }
    //选择行政区
    _selectDirstrict = (obj) => {
        this.setState({
            District: obj
        })
    }
    //办公室地址
    _selectAddress = (obj) => {
        this.setState({
            Address: obj,
            Radius:null
        })
    }
    //距离
    _selectDistance = (obj) => {
        this.setState({
            Radius:obj,
            Address:null
        })
    }
    //选择商圈
    _selectLocation = (obj) => {
        this.setState({
            Location: obj
        })
    }

    // 选择品牌
    _selectBrand = (obj) => {
     this.setState({
         Brand:obj
     })
    }


    renderBody() {
        const { dataList } = this.state;
        return (
            <View style={{ flex: 1 }}>


                <View style={{ flexDirection: 'row', flex: 1 }}>
                    {
                        this._leftView()
                    }
                    {
                        this._rightView()
                    }
                </View>
                {
                    ViewUtil.getThemeButton("确定", () => {
                        this.params.callBack(this.state.District, this.state.Location,this.state.Brand,this.state.Address,this.state.Radius*1000);
                        this.pop();
                    })
                }
            </View>
        )
    }
    _leftView = () => {
        const { filterData, currentIndex, locationsIndex, brandIndex } = this.state;
        const { District, Location, brandData ,Brand} = this.state;
        return (

            <View style={{ flex: 3 }}>
                <TouchableHighlight underlayColor='transparent' onPress={this._selectLeft.bind(this, 11)}>
                    <View style={[styles.left_row, { backgroundColor: currentIndex === 11 ? 'white' : null }]}>
                        <CustomText text={'办公室地址'} />
                    </View>
                </TouchableHighlight> 
                <TouchableHighlight underlayColor='transparent' onPress={this._selectLeft.bind(this, 0)}>
                    <View style={[styles.left_row, { backgroundColor: currentIndex === 0 ? 'white' : null }]}>
                        <CustomText text='行政区' />
                    </View>
                </TouchableHighlight>
                <TouchableHighlight underlayColor='transparent' onPress={this._selectLeft.bind(this, 1)}>
                    <View style={[styles.left_row, { backgroundColor: currentIndex === 1 ? 'white' : null }]}>
                        <CustomText text={'品牌'} />
                    </View>
                </TouchableHighlight>
                {
                         filterData && filterData.otwLocations ?
                            <View style={{ flexDirection: 'row' }}>
                                <View style={{ flex: 4 }}>
                                    <View>
                                        {
                                            filterData.otwLocations.map((obj, index) => {
                                                return (
                                                    <TouchableHighlight key={index} underlayColor='transparent' 
                                                                        onPress={this._selectLeft.bind(this, index+2)}>
                                                        <View style={[styles.left_row, { backgroundColor:(currentIndex === index+2) ? 'white' : null }]}>
                                                            <CustomText text={obj.title} />
                                                        </View>
                                                    </TouchableHighlight>
                                                )
                                            })
                                        }
                                    </View>
                                </View>
                            </View>
                            : null
                }
                <TouchableHighlight underlayColor='transparent' onPress={this._selectLeft.bind(this, 10)}>
                    <View style={[styles.left_row, { backgroundColor: currentIndex === 10 ? 'white' : null }]}>
                        <CustomText text={'距离'} />
                    </View>
                </TouchableHighlight>
                
                
            </View>
        )
    }
    _rightView = () => {
        const { filterData, currentIndex, locationsIndex, brandIndex } = this.state;
        const { District, Location, brandData , Brand, Address, Radius} = this.state;
        let distanceArr = ['0.5','1','2','4','8','10'];
    
        return (
            <View style={{ flex: 7, }}>
                
                <View>
                    {
                        currentIndex === 0 && filterData && filterData.Districts ?
                            <ScrollView keyboardShouldPersistTaps='handled'>
                                <TouchableHighlight underlayColor='transparent' onPress={this._selectDirstrict.bind(this, 0)}>
                                                        <View style={[styles.right_row]}>
                                                        <CustomText text={'不限'}/>
                                                        </View>
                                                </TouchableHighlight>
                                {filterData.Districts.map((obj, index) => {
                                    return (
                                        <TouchableHighlight key={index} underlayColor='transparent' onPress={this._selectDirstrict.bind(this, obj)}>
                                            <View style={[styles.right_row]}>
                                                <CustomText text={obj.Name} style={{color:District && District.Code === obj.Code ?Theme.theme:Theme.commonFontColor}}/>
                                                {/* {District && District.Code === obj.Code ? <AntDesign name={'check'} size={24} color={Theme.theme} /> : null} */}
                                            </View>
                                        </TouchableHighlight>
                                    )
                                })
                                }
                            </ScrollView>
                            : null
                    }
                    {   
                        filterData && filterData.otwLocations ? 
                         <ScrollView keyboardShouldPersistTaps='handled'>
                           {
                               filterData.otwLocations.map((Items, index) => {
                                    return(
                                        currentIndex === index+2?
                                            <View key={index} style={{flexDirection:'column'}}>
                                                <TouchableHighlight key={index} underlayColor='transparent' onPress={this._selectLocation.bind(this, 0)}>
                                                        <View style={[styles.right_row]}>
                                                        <CustomText text={'不限'}/>
                                                        </View>
                                                </TouchableHighlight>
                                               { Items.data.map((item,index)=>{
                                                    return(
                                                        <TouchableHighlight key={index} underlayColor='transparent' onPress={this._selectLocation.bind(this, item)}>
                                                                <View style={[styles.right_row]}>
                                                                    <CustomText text={item.Name} style={{color:Location && Location.Code === item.Code ? Theme.theme:Theme.commonFontColor}}/>
                                                                    {/* {Location && Location.Code === item.Code ? <AntDesign name={'check'} size={24} color={Theme.theme} /> : null} */}
                                                                </View>
                                                        </TouchableHighlight> 
                                                    )
                                                })
                                            }
                                            </View>
                                        :null
                                     )
                                } ) 
                             }
                         </ScrollView>                         
                        :null
                    }
                   
                    {
                        currentIndex === 1 && brandData ?
                            <View style={{ flexDirection: 'row',backgroundColor:Theme.bgFliter }}>
                                <View style={{ flex: 4 }}>
                                    <ScrollView keyboardShouldPersistTaps='handled'>
                                        {
                                            brandData.map((obj, index) => {
                                                return (
                                                    <TouchableHighlight key={index} underlayColor='transparent' onPress={() => this.setState({ brandIndex: index })}>
                                                        <View style={[styles.left_row, { backgroundColor: brandIndex === index ? 'white' : null }]}>
                                                            <CustomText text={obj.BrandTypeDesc} />
                                                        </View>
                                                    </TouchableHighlight>
                                                )
                                            })

                                        }

                                    </ScrollView>
                                </View>
                                <View style={{ flex: 6 }}>
                                    <ScrollView keyboardShouldPersistTaps='handled'>
                                         <TouchableHighlight underlayColor='transparent' onPress={this._selectBrand.bind(this, 0)}>
                                                <View style={styles.right_row}>
                                                    <CustomText text={'不限'} />
                                                </View>
                                         </TouchableHighlight>
                                        {
                                            brandData[brandIndex]&&brandData[brandIndex].BrandList.map((obj, index) => {
                                                return (
                                                    <TouchableHighlight key={index} underlayColor='transparent' onPress={this._selectBrand.bind(this, obj)}>
                                                        <View style={styles.right_row}>
                                                            <CustomText text={obj.Name} style={{color:Brand && Brand.Code === obj.Code ? Theme.theme:Theme.commonFontColor}} />
                                                            {/* {Brand && Brand.Code === obj.Code ? <AntDesign name={'check'} size={24} color={Theme.theme} /> : null} */}
                                                        </View>
                                                    </TouchableHighlight>
                                                )
                                            })

                                        }

                                    </ScrollView>
                                </View>
                            </View>
                            : null
                    }
                     {
                        currentIndex === 10?
                            <ScrollView keyboardShouldPersistTaps='handled'>
                                <TouchableHighlight underlayColor='transparent' onPress={this._selectDistance.bind(this, 0)}>
                                                        <View style={[styles.right_row]}>
                                                        <CustomText text={'不限'}/>
                                                        </View>
                                                </TouchableHighlight>
                                {distanceArr.map((obj, index) => {
                                    return (
                                        <TouchableHighlight key={index} underlayColor='transparent' onPress={this._selectDistance.bind(this, obj)}>
                                            <View style={[styles.right_row]}>
                                                <CustomText text={obj==0.5?'500m':obj+'km'} style={{color:Radius && Radius === obj ?  Theme.theme:Theme.commonFontColor}}/>
                                                {/* {Radius && Radius === obj ? <AntDesign name={'check'} size={24} color={Theme.theme} /> : null} */}
                                            </View>
                                        </TouchableHighlight>
                                    )
                                })
                                }
                            </ScrollView>
                            : null
                    }
                    {
                        currentIndex === 11 && filterData && filterData.OftenAddress ?
                            <ScrollView keyboardShouldPersistTaps='handled'>
                                <TouchableHighlight underlayColor='transparent' onPress={this._selectAddress.bind(this, 0)}>
                                                        <View style={[styles.right_row]}>
                                                        <CustomText text={'不限'}/>
                                                        </View>
                                                </TouchableHighlight>
                                {filterData.OftenAddress.map((obj, index) => {
                                    return (
                                        <TouchableHighlight key={index} underlayColor='transparent' onPress={this._selectAddress.bind(this, obj)}>
                                            <View style={[styles.right_row]}>
                                                <CustomText text={obj.Address} style={{color:Address && Address.Id === obj.Id ?  Theme.theme:Theme.commonFontColor}}/>
                                                {/* {Address && Address.Id === obj.Id ? <AntDesign name={'check'} size={24} color={Theme.theme} /> : null} */}
                                            </View>
                                        </TouchableHighlight>
                                    )
                                })
                                }
                            </ScrollView>
                            : null
                    }
                </View>

            </View>
        )
    }
}
const styles = StyleSheet.create({
    left_row: {
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    right_row: {
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        backgroundColor: "white"
    }
})