import React from 'react';
import {

} from 'react-native';
import PropTypes from 'prop-types';
import WebView from 'react-native-webview';
import BackPress from '../../common/BackPress';
import NavigationUtils from '../../navigator/NavigationUtils';
import SafeAreaViewPlus from '../../custom/SafeAreaViewPlus';
import NavigationBar from '../../custom/NavigationBar';
import ViewUtil from '../../util/ViewUtil';

export default class WebViewScreen extends React.Component {

    constructor(props) {
        super(props);
        this.params = (props.route && props.route.params) || (props.navigation && props.navigation.state && props.navigation.state.params) || {};

        let url = this.params && this.params.url;
        if (url && url.includes('m.douguo.com')) {
            url += `&version=${appBuildVersion}`;
        }
        this.state = {
            canGoBack: false,
            url: url,
            // url: `https://m.douguo.com/mall?f=zls&dgfromsource=vipdayzls&_vs=1001500&version=${appBuildVersion}`,
            title: this.params && this.params.title
        }
        this.backPress = new BackPress({ backPress: () => this.onBackPress() })

    }
    componentDidMount() {
        this.backPress.componentDidMount();
    }
    componentWillUnmount() {
        this.backPress.componentWillUnmount();
    }
    onNavigationStateChange = (e) => {
        this.setState({
            canGoBack: e && e.canGoBack,
            // url: e.url
        })
    }
    onBackPress = () => {
        this.pop();
        return true;
    }

    pop() {
        if (this.state.canGoBack) {
            this.webView.goBack();
        } else {
            NavigationUtils.pop(this.props.navigation);
        }
    }

    _getHost = (url) => {
        if (!url) return '';
        try {
            return String(url)
                .replace(/^https?:\/\//i, '')
                .split('/')[0]
                .split('?')[0]
                .split('#')[0]
                .toLowerCase();
        } catch (e) {
            return '';
        }
    }

    _shouldEnableDomStorage = (url) => {
        const host = this._getHost(url);
        if (!host) return false;
        return host === 'flights.cathaypacific.com' || host.endsWith('.cathaypacific.com');
    }

    render() {
        const { url } = this.state;

        return (
            <SafeAreaViewPlus>
                <NavigationBar title={this.state.title} 
                leftButton={ViewUtil.getLeftBackButton(this.pop.bind(this))} 
                rightButton={ViewUtil._getRightHomeButton(() => {
                    NavigationUtils.popToTop(this.props.navigation);
                })} />
                
                {this._renderWebView()}
            </SafeAreaViewPlus>
        )
    }

    _renderWebView = () => {
        const enableDomStorage = this._shouldEnableDomStorage(this.state.url);
            return (<WebView
                useWebKit={true}
                // domStorageEnabled={true}
                geolocationEnabled={true}
                style={{ flex: 1 }}
                ref={webView => this.webView = webView}
                startInLoadingState={true}
                onNavigationStateChange={e => this.onNavigationStateChange(e)}
                source={{ uri: this.state.url, }}
                sharedCookiesEnabled={enableDomStorage}
                allowFileAccess = {false}  
                // javaScriptEnabled = {false} //Webview File同源策略绕过漏洞
                saveFormDataDisabled = {true} //Webview明文存储密码风险
                domStorageEnabled={enableDomStorage}
                remoteDebuggingEnabled = {false}
            />)
        
    }
}