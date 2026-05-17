import React from 'react';
import {
    View,
    StyleSheet,
    SectionList,
    TouchableHighlight,
    Dimensions
} from 'react-native';
import SuperView from '../../super/SuperView';
import Theme from '../../res/styles/Theme';
import SearchInput from '../../custom/SearchInput';
import TrainHotData from '../../res/js/train_city_code';
import CustomText from '../../custom/CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TrainService from '../../service/TrainService';
import StorageUtil from '../../util/StorageUtil';
import Key from '../../res/styles/Key';
import Util from '../../util/Util';
export default class TrainCityScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '选择城市'
        }
        this._tabBarBottomView = {
            bottomInset: true
        }
        this.screenWidth = Dimensions.get('window').width
        this.state = {
            sections: [],
            recordSection: [],
            keyWord: '',
            TrainCities: [],
        }
    }
    componentDidMount() {
        StorageUtil.loadKeyId(Key.TrainCitysData).then(data => {
            if (data) {
                this._analyseData(data);
            } else {
                this._loadCitys();
            }
        }).catch(error => {
            this._loadCitys();
        })
    }

    _loadCitys = () => {
        this.showLoadingView();
        TrainService.CommonTrainStation2().then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                StorageUtil.saveKeyId(Key.TrainCitysData, response.data);
                this._analyseData(response.data);
            } else {
                this.toastMsg(response.message || '获取数据失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取数据异常');
        })
    }

    _analyseData = (data) => {
        this.setState({
            TrainCities: data
        })
        let cities = [];
        let fromCode = 'A'.charCodeAt(0);
        let toCode = 'Z'.charCodeAt(0);
        for (let index = fromCode; index < toCode + 1; index++) {
            cities.push({ title: String.fromCharCode(index), data: [] });
        }
        this.setState({
            sections: cities,
            recordSection: cities
        })
    }

    _onEndEditing = () => {
        const { keyWord,TrainCities } = this.state;
        if (keyWord.length > 0) {
            let cityList = TrainCities.filter((item) => {
                let key = keyWord.toLowerCase()//转换成小写
                return (item.Name&&item.Name.includes(key) || item.Spell&&item.Spell.includes(key)) && !item.IsVirtualStation;
            });
            this.setState({
                sections: [{ title: '搜索结果', data: cityList, isOpen: true }]
            })
        } else {
            this.setState({
                sections: this.state.recordSection
            })
        }
    }


    // 选择城市
    _cityBtnClick = (item) => {
        this.params.callBack(item);
        this.pop();
    }
    //初始化行内容
    _sectionBtnClick = (section) => {
        if (!section || !Array.isArray(section.data)) {
            return; // 防止 section 或 section.data 不存在导致崩溃
        }
        if (!Array.isArray(this.state.TrainCities)) {
            return; // 防止 TrainCities 不是数组导致崩溃
        }
        if (section.data.length === 0) {
           this.state.TrainCities.forEach(item => {
                if (item?.Spell) {
                    if (item?.Spell?.[0]?.toUpperCase() === section.title) {
                        section.data.push(item);
                    }
                }
            })
        }
        section.isOpen = !section.isOpen;
        this.setState({});
    }
    /**
     *  热门城市
     */
    _renderHenderView = () => {
        let hotCitys = TrainHotData;
        return (
            <View>
                {
                    hotCitys && hotCitys.length > 0 ?
                        <View style={{marginBottom:10}} >
                            <CustomText text='热门' style={{marginLeft:15,marginTop:10}} />
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {
                                    hotCitys.map((item, index) => {
                                        return (
                                            <TouchableHighlight key={index} underlayColor="transparent" onPress={this._cityBtnClick.bind(this, item)}>
                                                <View style={{  width: Util.Parse.isChinese()? this.screenWidth/5:null,
                                                                padding: Util.Parse.isChinese()? null: 5,
                                                                height: 30,
                                                                borderRadius: 5,
                                                                backgroundColor: 'white',
                                                                marginTop: 10,
                                                                marginLeft: this.screenWidth/5/5,
                                                                alignItems: 'center',
                                                                justifyContent: "center",
                                                                borderWidth:1,
                                                                borderColor:Theme.promptFontColor,
                                                                }}>
                                                    <CustomText numberOfLines={1} text={item.Name} style={{color:Theme.commonFontColor}}/>
                                                </View>
                                            </TouchableHighlight>
                                        )
                                    })
                                }
                            </View>
                        </View> : null
                }
            </View>
        );
    }
    // 行内容
    _renderItem = ({ item, index, section }) => {
        if (!section.isOpen) return null;
        return (
            <TouchableHighlight underlayColor='transparent' onPress={this._cityBtnClick.bind(this, item)}>
                <View style={{  borderBottomColor: Theme.lineColor,
                                borderBottomWidth: 1,
                                justifyContent: 'center',
                                backgroundColor: '#fff',
                                height: 44,
                                marginLeft:this.screenWidth/5/5,
                                marginRight:this.screenWidth/5/5,
                                borderRadius:5}}>
                    <CustomText style={{ marginLeft: 5 }} text={Util.Parse.isChinese() ? item.Name : (item.EnName +"  "+ '(' + item.Name + ')')} />
                </View>
            </TouchableHighlight>
        )

    }
    // 段内容
    _renderSectionHeader = ({ section }) => {
        return (
            <TouchableHighlight underlayColor='transparent' onPress={this._sectionBtnClick.bind(this, section)}>
                <View style={{  backgroundColor: '#efefef',
                                height: 44,
                                alignItems: 'center',
                                flex: 1,
                                paddingLeft:this.screenWidth/5/5,
                                paddingRight:this.screenWidth/5/5,
                                justifyContent: 'space-between',
                                flexDirection: 'row',
                                borderBottomWidth: 1,
                                borderBottomColor: Theme.promptFontColor
                            }}>
                    <CustomText style={{  }} text={section.title} />
                    <Ionicons name={section.isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={Theme.assistFontColor} />
                </View>
            </TouchableHighlight>
        )
    }
    renderBody() {
        return (
            <View style={{ flex: 1,backgroundColor:'#fff' }}>
                <SearchInput placeholder='请输入城市名称或简拼' value={this.state.keyWord} onChangeText={(text) => this.setState({ keyWord: text }, this._onEndEditing)} fromSearch={true}/>
                <SectionList
                    ref={sectionList => this.sectionList = sectionList}
                    ListHeaderComponent={this._renderHenderView}
                    sections={this.state.sections}
                    renderItem={this._renderItem}
                    getItemCount={(data) => {
                        console.log(data);
                        return 1;
                    }}
                    renderSectionHeader={this._renderSectionHeader}
                    keyExtractor={(item, index) => String(index)}
                />
            </View>
        )
    }
}


const styles = StyleSheet.create({
})