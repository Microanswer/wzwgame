/**
 * 资源加载器。
 */

/**
 *
 * @type {{[k:string]: {
 *     data: any,
 *     status: "pending"|"loaded"|"error",
 *     error: string?
 * }}}
 */
const resourceMap = {};

/**
 *
 * @param resPath {string}
 * @param options {{
 *     useFmt: "base64"|"raw", // 加载完成数据后，将数据以此指定的格式存储于内存。
 * }?}
 *
 * @return {{
 *     data: any,
 *     status: "pending"|"loaded"|"error",
 *     error: string?
 * }}
 */
function newLoader(resPath, options) {
    let lod = {
        data: undefined,
        status: "pending",
        error: undefined
    };

    let img = new Image();
    img.onload = function () {
        lod.status = "loaded";
        lod.data = img;
    }
    img.onerror = function (e) {
        lod.status = "error";
        lod.error = e;
    }
    img.src = resPath;

    return lod;
}

/**
 *
 * @param resPath {string}
 * @param options {{
 *     useFmt: "base64"|"raw", // 加载完成数据后，将数据以此指定的格式存储于内存。
 * }?}
 */
function getResource(resPath, options) {
    if (!options) {
        options = {};
    }
    if (!options.useFmt) {
        options.useFmt = "raw";
    }
    let id = resPath +"."+ options.useFmt;

    let resource = resourceMap[id];
    if (resource) {
        if (resource.status === "loaded") {
            return resource.data;
        }
        // 运行到这里，说明此数据没有加载完成或加载出错。

        if (resource.status === "error") {
            console.error("资源加载出错：", resource.error);
        }
        return undefined;
    }

    // 没有此数据，立即进行加载。
    resourceMap[id] = newLoader(resPath, options);
}

module.exports = {
    getResource
}