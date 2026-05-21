
import CommonService from './CommonService';
import RNFetchBlob from 'rn-fetch-blob';
import RNFileSelect from 'react-native-file-select-mk';
export default class OpenGetFile {
    static getFile(_this) {
        return new Promise((resolve, reject) => {
            RNFileSelect.showFileList((res) => {
                if (!res) {
                    resolve(null);
                    return;
                }
                if (res.type === 'cancel') {
                    resolve(null);
                    return;
                }
                if (res.type !== 'path' || !res.path) {
                    _this?.toastMsg?.('上传失败');
                    resolve(null);
                    return;
                }

                let path = res.path;
                if (path.startsWith('file://')) {
                    path = path.slice(7);
                }
                let pos = path.lastIndexOf('/');
                let fileName = pos > -1 ? path.substr(pos + 1) : path;
                let pname = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
                let phouzhui = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.') + 1) : '';

                let data = RNFetchBlob.wrap(path);
                let model = [];
                model.unshift({ name: pname, data: data, filename: fileName, type: phouzhui });
                CommonService.OrderFileUpload(model).then(response => {
                    if (response && response.success && response.data && response.data.length > 0) {
                        resolve(response.data[0]);
                    } else {
                        _this?.toastMsg?.(response?.message || '上传失败');
                        resolve(null);
                    }
                }).catch(error => {
                    _this?.toastMsg?.(error?.message || '上传失败');
                    resolve(null);
                })
            })
        })
    }
}
