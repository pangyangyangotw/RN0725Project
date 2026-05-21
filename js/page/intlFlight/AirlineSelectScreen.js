import React from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    TouchableHighlight
} from 'react-native';
import SuperView from '../../super/SuperView';
import SearchInput from '../../custom/SearchInput';
import CustomText from '../../custom/CustomText';
import InflFlightService from '../../service/InflFlightService'; 
import Theme from '../../res/styles/Theme';
import Util from '../../util/Util';
export default class AirlineSelectScreen extends SuperView {
    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};
        this._navigationHeaderView = {
            title: '航空公司',
        }
        this.state = {
            keyWord: '',
            projectList: [],
            isNoMoreData: false,
            isLoading: true,
            isLoadingMore: false,
        }
    }
    componentDidMount() {
        this._reloadProjectList();
    }
    _reloadProjectList = () => {
        let model = {
            NationalType:2,//国际
            keyWord:this.state.keyWord
        }
        this.showLoadingView()
        InflFlightService.CommonAirline(model).then(response => {
            this.hideLoadingView()  
            if (response && response.success && response.data) {
                    this.setState({
                        projectList:response.data
                    })
            }else{
            this.toastMsg(response.message);
            }
        }).catch(error => {
            this.hideLoadingView()
            this.toastMsg(error.message || '加载数据失败请重试');
        })
    }

    _submitEditing = () => {
        this.setState({
            projectList: [],
            page: 1
        }, () => {
            this._reloadProjectList();
        })
    }

    _backOrderClick = (item) => {
        this.params.callBack(item);
        this.pop();
    }
    _renderItem = ({ item }) => {
        return (
            <TouchableHighlight underlayColor='transparent' onPress={ () => this._backOrderClick(item) } style={{ marginHorizontal: 10, marginTop:10 }}>
                <View style={styles.row}>
                    <View style={{flexDirection:'row',flexWrap:'wrap'}}>
                        <CustomText text={item.Code} style={{ color:Theme.commonFontColor }} />
                    </View>
                    <View style={{flexWrap:'wrap'}}>
                        {item.FullName ? <CustomText  text={Util.Parse.isChinese()? item.FullName : item.EnName?item.EnName:item.Code}  style={{ color:Theme.assistFontColor }} /> : null}
                    </View>
                </View>
            </TouchableHighlight>
        )
    }

    renderBody() {
        const { keyWord, projectList } = this.state;
        let placeholder = '请输入至少2个连续字进行搜索'
        return (
            <View style={{ flex: 1 }}>
                <SearchInput placeholder={placeholder} value={keyWord} onChangeText={(text) => this.setState({ keyWord: text })} onSubmitEditing={this._submitEditing} />
                <FlatList
                    data={projectList}
                    renderItem={this._renderItem}
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item, index) => {
                        return String(index);
                    }}
                    onEndReachedThreshold={0.1}
                />
            </View>
        )
    }
}
const styles = StyleSheet.create({
    row: {
        backgroundColor: 'white',
        borderBottomColor: Theme.lineColor,
        borderBottomWidth: 1,
        padding: 15,
        borderRadius:5,
        flexDirection:'row',
        justifyContent:'space-between',
    }
})