
import React from 'react';
import {
    SectionList,
    View,
    StyleSheet,
    TouchableHighlight,
    InteractionManager,
    Dimensions
} from 'react-native';
import SuperView from "../../super/SuperView";
import SearchInput from '../../custom/SearchInput';
import StorageUtil from '../../util/StorageUtil';
import Key from '../../res/styles/Key';
import CustomText from '../../custom/CustomText';
import Theme from '../../res/styles/Theme';
import HotelService from '../../service/HotelService';
import Util from '../../util/Util';
import sectionListGetItemLayout from '../../custom/SectionListGetItemLayout';
export default class HotelCityScreen extends SuperView {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '城市选择',
        }
        this._tabBarBottomView = {
            bottomInset: true
        }
        this.screenWidth=Dimensions.get('window').width
        this.state = {
            hotCitys: [],
            letters: [],
            sections: [],
            recordSections: [],
            keyWord: "",
        }
        this.getItemLayout = sectionListGetItemLayout({
            // The height of the row with rowData at the given sectionIndex and rowIndex
            getItemHeight: (rowData, sectionIndex, rowIndex) => 45,

            // These four properties are optional
            getSeparatorHeight: () => 0, // The height of your separators
            getSectionHeaderHeight: () => 35, // The height of your section headers
            getSectionFooterHeight: () => 0, // The height of your section footers
            listHeaderHeight: 550, // The height of your list header
        })
    }
    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            StorageUtil.loadKeyId(Key.HotelCitysData).then(response => {
                if (response) {
                    this._analyData(response);
                }
            }).catch(error => {
                this._loadCityData();
            })

        })
    }

    _loadCityData = () => {
        this.showLoadingView();
        HotelService.getHotelCityList().then(response => {
            this.hideLoadingView();
            if (response && response.success) {
                StorageUtil.saveKeyId(Key.HotelCitysData, response.data);
                this._analyData(response.data);
            } else {
                this.toastMsg(response.message || '获取城市信息失败');
            }
        }).catch(error => {
            this.hideLoadingView();
            this.toastMsg(error.message || '获取城市信息失败');
        })
    }
    /**
     *  分析数据
     */
    _analyData = (data) => {
        if (!Array.isArray(data)) return;
        let lettersArr = [];
        let sections = [];
        let hotCitys = [];
        let startIndex = 'A'.charCodeAt(0);
        let endIndex = 'Z'.charCodeAt(0);
        for (let index = startIndex; index < endIndex + 1; index++) {
            lettersArr.push(String.fromCharCode(index));
            sections.push({ title: String.fromCharCode(index), data: [] });
        }
        data.forEach(item => {
            if (item?.Hot > 7 &&hotCitys.length < 20) {
                hotCitys.push(item);
            }
            const firstChar = item?.EnName ? item.EnName.charAt(0) : null;
            let section = sections.find(obj => obj.title === firstChar);
            if (section) {
                if (!Array.isArray(section.data)) {
                    section.data = [];
                }
                section.data.push(item);
            }
        })
        this.setState({
            hotCitys,
            letters: lettersArr,
            sections,
            recordSections: sections
        })
    }
    /**
     *  城市点击事件
     */
    _cityBtnClick = (item) => {
        this.params.setBackCity(item);
        this.pop();
    }
    /**
     *  字母检索点击事件
     */
    _letterBtnClick = (item) => {
        if (!item) return;
        if (this.state.sections.length === 1) return;
        let index = this.state.letters.findIndex(obj => obj === item);
        if (index > -1) {
            this.sectionList.scrollToLocation({ sectionIndex: index, itemIndex: 0 });
        }
    }
    /**
     *  检索
     */
    _onchange = () => {
        if (!this.state.keyWord) {
            this.setState({
                sections: this.state.recordSections
            })
        } else {
            let list = [];
            this.state.recordSections.forEach(item => {
                if (item.data) {
                    item.data.forEach(obj => {
                        let arrLetters =obj&&obj.Letters&&obj.Letters.split('|')
                        let miniLetters = []
                        arrLetters&&arrLetters.map(_item=>{
                            miniLetters.push(_item.toLowerCase()) 
                        })
                        let lower = this.state.keyWord.toUpperCase();
                        let upperName = (obj.EnName && obj.EnName.toUpperCase());
                        let miniKey = this.state.keyWord.toLowerCase();
                        if ( (upperName && upperName.includes(lower)) || 
                             (obj.Name&&obj.Name.includes(this.state.keyWord)) || 
                             (obj.EnName && obj.EnName.includes(this.state.keyWord))||
                             (miniLetters && miniLetters.includes(miniKey))
                            ) {
                            list.push(obj);
                        }
                    })
                }
            })
            this.setState({
                sections: [{ title: '搜索结果', data: list }]
            })
        }
    }

    // 头部视图
    _renderHenderView = () => {
        const { hotCitys, letters } = this.state;
        return (
            <View>
                {
                    hotCitys && hotCitys.length > 0 ?
                        <View>
                            <CustomText text='热门' style={{marginLeft:15,marginTop:10}}/>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {
                                    hotCitys.map((item, index) => {
                                        return (
                                            <TouchableHighlight key={index} underlayColor="transparent" onPress={this._cityBtnClick.bind(this, item)}>
                                                <View style={{
                                                    width: this.screenWidth/5,
                                                    height: 30,
                                                    borderRadius: 5,
                                                    backgroundColor: 'white',
                                                    marginTop: 10,
                                                    marginLeft:this.screenWidth/5/5,
                                                    // marginHorizontal: 5,
                                                    alignItems: 'center',
                                                    justifyContent: "center",
                                                    borderWidth:1,
                                                    borderColor:Theme.promptFontColor
                                                }}>
                                                    <CustomText numberOfLines={1} text={Util.Parse.isChinese() ? item.Name : item.EnName} style={{color:Theme.commonFontColor}}/>
                                                </View>
                                            </TouchableHighlight>
                                        )
                                    })
                                }
                            </View>
                        </View> : null
                }
                {
                    letters && letters.length > 0 ?
                        <View style={{marginBottom:15}}>
                            <CustomText text='字母检索' style={{marginTop:10,marginLeft:15}} />
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap',marginLeft:15,justifyContent: 'flex-start', marginTop: 5 }}>
                                {
                                    letters.map((item, index) => {
                                        return (
                                            <TouchableHighlight key={index} underlayColor="transparent" onPress={this._letterBtnClick.bind(this, item)}>
                                                <View style={{
                                                    width:this.screenWidth / 10,
                                                    height: this.screenWidth / 10,
                                                    borderRadius: 3,
                                                    backgroundColor: 'white',
                                                    marginTop: this.screenWidth / 10 / 6,
                                                    marginRight: this.screenWidth / 10 / 6,
                                                    alignItems: 'center',
                                                    justifyContent: "center",
                                                    borderWidth:1,
                                                    borderColor:Theme.promptFontColor,
                                                }}>
                                                    <CustomText numberOfLines={1} text={item} style={{color:Theme.commonFontColor}}/>
                                                </View>
                                            </TouchableHighlight>
                                        )
                                    })
                                }
                            </View>
                        </View> : null
                }
            </View>
        )
    }
    _renderSectionHeader = ({ section: { title } }) => {
        return (
            <View style={styles.section}>
                <CustomText style={{ marginLeft: 15, color: Theme.fontColor }} text={title} />
            </View>
        )
    }
    _renderItem = ({ item, index }) => {
        return (
            <TouchableHighlight underlayColor='transparent' onPress={this._cityBtnClick.bind(this, item)}>
                <View style={{
                    borderBottomColor: Theme.lineColor,
                    borderBottomWidth: 1,
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    height: 44,
                    marginLeft:this.screenWidth/5/5,
                    marginRight:this.screenWidth/5/5,
                    borderColor:Theme.promptFontColor
                }}>
                    <CustomText text={Util.Parse.isChinese() ? item.Name : item.EnName} />
                </View>
            </TouchableHighlight>
        )
    }
    renderBody() {
        return (
            <View style={{ flex: 1, backgroundColor:'#fff' }}>
                <SearchInput placeholder='城市名称' value={this.state.keyWord}  onChangeText={(text) => this.setState({ keyWord: text }, this._onchange)} fromSearch={true} />
                <SectionList
                    style={{ flex: 1 }}
                    ref={sectionList => this.sectionList = sectionList}
                    ListHeaderComponent={this.state.sections.length > 1 ? this._renderHenderView:null}
                    sections={this.state.sections}
                    renderItem={this._renderItem}
                    renderSectionHeader={this._renderSectionHeader}
                    keyExtractor={(item, index) => String(index)}
                    getItemLayout={this.getItemLayout}
                />
            </View>
        )
    }
}


const styles = StyleSheet.create({
    section: {
        backgroundColor: '#eaeaea',
        height: 35,
        justifyContent: 'center',
        flex: 1
    }
})