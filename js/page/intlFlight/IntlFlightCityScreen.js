import React from 'react';
import {
    View,
    Text,
    TouchableHighlight,
    FlatList,
    StyleSheet,
    Dimensions,
} from 'react-native';

import SuperView from '../../super/SuperView';
import IntlHotCities from '../../res/js/intl_hotCities';
import SearchInput from '../../custom/SearchInput';
import Util from '../../util/Util';
import CustomText from '../../custom/CustomText';
import InflFlightService from '../../service/InflFlightService';
import Theme from '../../res/styles/Theme';

/**
 * 国际机票选择城市
 */
export default class SelectCityScreen extends SuperView {

    constructor(props) {

        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '选择城市'
        }
        this.screenWidth = Dimensions.get('window').width
        this.state = {
            keyword: '',
            cityList: [],
        };
    }


    /**
     * 搜索城市
     */
    _searchCity = () => {
        const { keyword } = this.state;
        if (keyword.length > 0) {
            // this.showLoadingView();
            InflFlightService.getAirportsByKeyword(keyword, 10).then(response => {
                this.hideLoadingView();
                if (response && response.success && Array.isArray(response.data)) {
                  let cityList = [];
                   response.data.forEach(item => {
                        if(item.AirportCode){
                            cityList.push({
                                CityCode: item.AirportCode,
                                Cname: item.AirportName ? item.AirportName : item.AirportEnName,
                                CityEg: item.AirportEnName ? item.AirportEnName : item.CityCode,
                                NationalCode: item.NationalCode,
                                NationalName: item.NationalName,
                                NationalEg: item.NationalEg,
                                CityName: item.CityName,
                                CityEnName: item.CityEnName
                               })
                        }
                   });
                    this.setState({ cityList });
                }
            }).catch(error => {
                this.hideLoadingView();
            });
        }
    }

    /**
     * 选择城市
     */
    _selectCity = (item) => {
        const { selectCity } = this.params;
        if (selectCity) {
            selectCity(item);
        }
        this.pop();
    }

    /**
     * 渲染热门城市
     */
    _renderHotCities = () => {
        return (
            <View style={{ flex: 1 }}>
                <View>
                    <CustomText style={{ fontSize: 15 ,marginLeft:15,marginTop:10}} text='热门' />
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {
                            IntlHotCities.map((item, index) => {
                                let transItem = {
                                    CityCode: item.CityCode,
                                    Cname: item.CityName || item.Cname,
                                    CityEg: item.CityEnName || item.CityEg,
                                    NationalCode: item.NationalCode,
                                    NationalName: item.NationalName,
                                }
                                return (
                                    <TouchableHighlight key={index} underlayColor="transparent" onPress={this._selectCity.bind(this,transItem)}>
                                        <View style={{
                                            width: this.screenWidth/5,
                                            height: 30,
                                            borderRadius: 5,
                                            backgroundColor: 'white',
                                            marginTop: 10,
                                            // marginHorizontal: 5,
                                            marginLeft:this.screenWidth/5/5,
                                            alignItems: 'center',
                                            justifyContent: "center",
                                            borderWidth:1,
                                            borderColor:Theme.promptFontColor
                                        }}>
                                            <CustomText numberOfLines={1} style={{color:Theme.commonFontColor}} text={Util.Parse.isChinese() ? transItem.Cname : (transItem.CityEg ? transItem.CityEg : transItem.CityCode)} />
                                        </View>
                                    </TouchableHighlight>
                                )
                            })
                        }
                    </View>
                </View>
            </View>
        );
    }

    /**
     * 渲染城市搜索结果
     */
    _renderCityList = () => {
        const { cityList } = this.state;
        return (
            <View style={{ flex: 1 }}>
                {
                    cityList.length > 0 ? (
                        <FlatList
                            data={cityList}
                            renderItem={this._renderCityListItem}
                            showsVerticalScrollIndicator={false}
                            keyExtractor={(item, index) => (String(index))}
                        />
                    ) : (
                            <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
                                <CustomText style={{ color: '#999' }} text='没有找到符合条件的城市' />
                            </View>
                        )
                }
            </View>
        );
    }

    /**
     * 渲染搜索后城市项
     */
    _renderCityListItem = (({ item, index }) => (
        <TouchableHighlight key={index} underlayColor='transparent' style={{ backgroundColor: 'white', justifyContent: 'center', paddingLeft: 20, marginBottom: 1, paddingVertical: 12 }} onPress={() => { this._selectCity(item) }}>

            <View style={{ flexDirection: 'row' }}>
                {item.CityName !== item.Cname ? <Text style={{ fontSize: 18 }}>↵</Text> : null}
                <Text allowFontScaling={false} style={{ fontSize: 18 }}><Text style={{ color: 'rgb(55,156,185)' }}>{Util.Parse.isChinese() ? item.CityName : item.CityEnName}</Text> {item.CityName === item.Cname ? '' : (Util.Parse.isChinese() ? item.Cname : item.CityEg)} <Text style={{ color: 'gray' }}>{Util.Parse.isChinese() ? item.NationalName : item.NationalEg} {item.CityCode}</Text></Text>
            </View>
        </TouchableHighlight>
    ));

    renderBody() {
        const { keyword } = this.state;
        return (
            <View style={{ flex: 1,backgroundColor:'#fff' }}>
                <SearchInput
                    backgroundColor={'#ddd'}
                    placeholder='请输入城市名称或三字码查询'
                    maxLength={20}
                    onEndEditing={this._searchCity}
                    value={keyword}
                    onChangeText={(keyword) => {
                        this.state.keyword = keyword;
                        this.setState({},()=>{
                            this._searchCity();
                        });
                    }}
                    onSubmitEditing={() => { this.showLoadingView(); this._searchCity() }}
                    fromSearch={true}
                />
                {
                    keyword && keyword.length > 0 ? (this._renderCityList()) : (this._renderHotCities())
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
   
})