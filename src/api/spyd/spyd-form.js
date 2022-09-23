export const spydForm = getSpydForm();

import { spydTool } from './spyd-tool';

function getSpydForm() {
    let extractObject = ($elm, cfg) => {
        let targetSelector = "input,textarea,select";
        let targetField = "field";

        if (cfg && cfg.targetSelector) {
            targetSelector = cfg.targetSelector;
        }

        if (cfg && cfg.targetField) {
            targetField = cfg.targetField;
        }

        let obj = {};

        $elm.find(targetSelector).each((idx, elm) => {
            if ($(elm)[0].dataset[targetField]) {
                obj[$(elm)[0].dataset[targetField]] = $(elm).val();
            }
        });

        return obj;
    };
    function isObject(val) {
        if (val === null) { return false; }
        return ((typeof val === 'function') || (typeof val === 'object'));
    }
    let validator = function () {

        let itemClass = "spyd-validation-item";

        let rules = {
            notEmpty: [],
            number: []
        };

        let addRuleSet = (name, list) => {
            rules[name] = list
            list.forEach(i => {
                if (i.id) { $(`#${i.id}`).addClass(itemClass); }
            });
        };

        let clearStyle = () => {
            $(`.${itemClass}`).removeClass("spyd_module_input_validation_fail");
        };

        return {
            clearRules: () => {
                rules = {}
            },
            notEmpty: list => {
                addRuleSet("notEmpty", list);
            },
            number: list => {
                addRuleSet("number", list);
            },
            check: () => {
                let ok = true;
                let resultList = [];

                console.log(rules);
                clearStyle();

                rules["notEmpty"].forEach(o => {
                    let $input = $(`#${o.id}`);
                    if ($input) {
                        if (spydTool.isEmpty($input.val())) {
                            ok = false;
                            resultList.push(["notEmpty", o.desc]);
                            //$input.css("background-color", "#ffffde");
                            $input.addClass("spyd_module_input_validation_fail");
                        }
                    }
                });

                return {
                    ok: ok,
                    list: resultList
                };
            }
        }
    }();
    let collectForm = function (selector, cfg) {
        let o = {};
        let targetField = "field";
        if (cfg && cfg.targetField) {
            targetField = cfg.targetField;
        }

        $(selector).each((idx, elm) => {
            let $elm = $(elm);
            let f = $elm[0].dataset[targetField];
            if (f) {
                o[f] = $elm.val();
            } else {
                if ($elm[0].name) {
                    o[$elm[0].name] = $elm.val();
                }
            }
        });

        return o;
    };
    let fillList = (list, $container, cfg) => {

        if (cfg && !cfg.append) {

            $container.empty();

            if (list.length === 0) {

                if (cfg && cfg.emptyTpl) {
                    $container.append(cfg.emptyTpl);
                } else if (cfg && cfg.noEmptyNote) {
                } else {

                    let noContent = `
<div style="padding:3px">
<div style="text-align:center;background-color:#F5F8FA;color:#aaa;padding:40px">
<span>无内容</span>
</div></div>`;
                    $container.append(noContent);
                }
                return;
            }
        }

        let itemTpl = `<div style="word-break:break-all;margin:20px 0"></div>`;
        if (cfg && cfg.itemTpl) {
            itemTpl = cfg.itemTpl;
        }

        list.forEach(o => {
            let $tpl = $(itemTpl);

            if (cfg && cfg.itemTpl) {
                let targetClass = ".item-field";

                if (!spydTool.isEmpty(cfg.targetClass)) {
                    targetClass = cfg.targetClass;
                }

                let $items = $tpl.find(targetClass);

                for (let k in o) {
                    $items.each((idx, elm) => {
                        if ($(elm)[0].dataset.field === k) {
                            if ($(elm).is("input")) {
                                $(elm).val(o[k]);
                            }
                            else {
                                $(elm).text(o[k]);
                            }
                        }
                    });
                }
            }
            else {
                let $content = $("<span></span>").text(JSON.stringify(o));
                $tpl.append($content);
            }

            if (cfg && cfg.itemHandler) {
                cfg.itemHandler(o, $tpl);
            }

            $container.append($tpl);
        })
    };
    let buildTable = function (list, fields) {
        let $tbl = $(`<table class="table m-table table-bordered" style="margin:0"></table>`);
        let rowTpl = `<tr></tr>`;
        let headerRow = $(rowTpl);
        fields.forEach(f => {
            let cell = $(`<th></th>`).text(f.name);
            headerRow.append(cell);
        });
        $tbl.append(headerRow);
        list.forEach(r => {
            let dataRow = $(rowTpl);
            fields.forEach(f => {
                let fieldText = "";
                if (r[f.key]) {
                    if (f.wordMap) {
                        if (f.wordMap[r[f.key]]) {
                            fieldText = f.wordMap[r[f.key]]
                        }
                    } else {
                        fieldText = r[f.key];
                    }
                }
                let cell = $(`<td></td>`).text(fieldText);
                dataRow.append(cell);
            });
            $tbl.append(dataRow);
        });
        return $tbl;
    };
    return {
        validator: validator,
        buildTable: buildTable,
        fillOptions: ($target, data, textField, valueField, selectedValue) => {
            let addItem = (text, value, isSelected) => {
                if (typeof text === 'string' || text instanceof String) {
                    let $item = $("<option></option>");
                    $item[0].innerText = text;
                    if (typeof value === 'string' || value instanceof String) {
                        $item.val(value);
                    }

                    if (isSelected) {
                        $item.attr("selected", "");
                    }
                    $target.append($item);
                }
            };
            $target.empty();
            if (spydTool.isEmpty(selectedValue)) {
                $target.append('<option disabled selected value>(请选择)</option>');
            }
            if (Array.isArray(data)) {
                data.forEach(o => {
                    if (isObject(o)) {
                        let text = "";
                        let value = "";

                        for (var k in o) {
                            if (k === textField) {
                                text = o[k];
                            };
                            if (k === valueField) {
                                value = o[k];
                            };
                        }

                        addItem(text, value, value === selectedValue);
                    }
                    else {
                        addItem(o.toString(), o.toString(), o.toString() === selectedValue);
                    }
                })
            }
            else if (isObject(data)) {
                for (var k in data) {
                    addItem(k, data[k], data[k] === selectedValue);
                }
            }
        },
        collectForm: (selector, cfg) => {
            return collectForm(selector, cfg);
        },
        collectList: (selector, cfg) => {
            let lst = [];
            $(selector).each((idx, elm) => {
                let o = extractObject($(elm), cfg);
                lst.push(o);
            });
            return lst;
        },
        postAsForm: async (target, o) => {
            let r = await fetch(target, {
                method: 'POST',
                headers: {
                    "content-type": "application/x-www-form-urlencoded"
                },
                body: spydTool.objToFormBody(o)
            });

            console.log(r.status + ":" + target);

            return r;
        },
        fillForm: (data, selector, cfg) => {
            let targetField = "field";
            if (cfg && cfg.targetField) {
                targetField = cfg.targetField;
            }

            $(selector).each((idx, elm) => {
                let $elm = $(elm);
                let f = $elm[0].dataset[targetField];
                for (var k in data) {
                    let displayContent = spydTool.isObject(data[k]) || Array.isArray(data[k]) ?
                        JSON.stringify(data[k], null, 4) : data[k];
                    if (f === k) {
                        if ($elm.is("input") || $elm.is("textarea")) {
                            $elm.val(displayContent);
                        }
                        else if ($elm.is("span")) {
                            if (spydTool.isEmpty(displayContent)) {
                                if (cfg && cfg.emptyTpl) {
                                    $elm.text(cfg.emptyTpl);
                                    if (cfg.emptyClass) {
                                        $elm.addClass(cfg.emptyClass);
                                    }
                                }
                            } else {
                                $elm.text(displayContent);
                            }
                        }
                    }
                }
            });
        },
        fillList: fillList,
        fillTree: (nodeList, $container, nodeTpl, selected, root) => {
            if (spydTool.isEmpty(nodeTpl)) {
                nodeTpl = `<div class="node-container">

            <a href="javascript:;" class="node-info">
                <div style="margin:5px 0;position:relative">
                    <span style="margin-right:3px"><i class="fa fa-angle-right text-secondary"></i></span>
                    <span class="node-title text-primary"></span>
                    <span class="node-desc text-gray-500 fs-8 ms-3" style="position:absolute;right:15px"></span>

                </div>
            </a>

            <div class="node-children" style="margin-left:20px"></div>

        </div>`;
            }
            let addNode = (node, $container, tpl) => {
                node.nodes.forEach(n => {
                    console.log("adding: " + node.id + " -> " + n.id);
                    let $tpl = $(tpl);

                    $tpl.find(".node-title").text(n.data.name);
                    $tpl.find(".node-info")[0].dataset.id = n.id;
                    $tpl.find(".node-info")[0].dataset.parent = n.data.parent;
                    $tpl.find(".node-info")[0].dataset.text = n.data.name;

                    if (n.data.desc) $tpl.find(".node-desc").text(n.data.desc);

                    addNode(n, $tpl.find(".node-children"), tpl);
                    $container.append($tpl);
                });
            };
            let buildTree = lst => {
                let rootNode_ = {
                    id: "",
                    nodes: [],
                    data: {
                        id: "",
                        name: "全部",
                        parent: ""
                    }
                };
                loadNodes(rootNode_, lst);
                return rootNode_;
            };
            let loadNodes = (parent, lst) => {
                let children = lst.filter(i => i.parent === parent.id);
                children.forEach(i => {
                    let n = {
                        id: i.id,
                        nodes: [],
                        data: i
                    }
                    parent.nodes.push(n);
                    loadNodes(n, lst);
                })
            };

            let rootNode = buildTree(nodeList);
            console.dir(rootNode);
            $container.empty();

            let $rootContainer = $("<div></div>");

            if (root) {
                $rootContainer = $(nodeTpl);

                $rootContainer.find(".node-title").text(root);
                $rootContainer.find(".node-info")[0].dataset.id = "";

                addNode(rootNode, $rootContainer.find(".node-children"), nodeTpl);
            } else {
                addNode(rootNode, $rootContainer, nodeTpl);
            }

            $rootContainer.find(".node-info").each((idx, elm) => {
                if (selected === $(elm)[0].dataset.id) {
                    $(elm).find(".node-title")
                        .addClass("text-warning")
                        .addClass("fw-boldest");
                }
            });

            $container.append($rootContainer);
        },
        windowManager: (() => {
            let cfg = {};
            let addWindow = (url, title) => {

                $(".spyd-win-tab").removeClass("selected");

                let urlHash = spydTool.objToBase64UrlSafe(url);

                let winTpl = `
<iframe class="spyd-win-iframe" style="width:100%;border:none" data-urlhash="">
<iframe>
`;

                let tabTpl = `
<div class="spyd-win-tab" style="display:inline-block;white-space:nowrap;margin:2px;overflow:hidden;border-radius:2px;cursor:pointer;padding:0 3px" data-urlhash="">
    <div style="display:inline-block;padding:4px 6px;color:#ccc" class="spyd-win-tab-reload">
        <span><i class="fa fa-redo" style="font-size:12px"></i></span>
    </div>
    <div style="display:inline-block;width:120px;white-space:nowrap;height:22px;font-size:12px;text-overflow:ellipsis;overflow:hidden;vertical-align:bottom;padding-top:1px"
        class="spyd-win-tab-title">
        <span class="spyd-win-tab-text" style="font-family:'Microsoft YaHei'"></span>
    </div>
    <div style="display:inline-block;padding:6px 6px;color:#ccc" class="spyd-win-tab-close">
        <span><i class="fa fa-times" style="font-size:12px"></i></span>
    </div>
</div>
`;

                let $tab = $(tabTpl);
                let $win = $(winTpl)

                $tab[0].dataset.urlhash = urlHash;
                $win[0].dataset.urlhash = urlHash;

                $tab.find(".spyd-win-tab-text").text(title);

                $tab//.addClass("bg-primary")
                    //.addClass("text-white")
                    .addClass("selected");

                $win.attr("src", url);

                if (cfg.$tabContainer) {
                    cfg.$tabContainer.append($tab);
                }

                if (cfg.$windowContainer) {
                    cfg.$windowContainer.append($win);
                }
            };
            return {
                init: async function (v) {
                    let self_ = this;
                    cfg = v;
                    $(document).on("click", ".spyd-win-tab", function () {
                        let urlHash = $(this)[0].dataset.urlhash;
                        let url = spydTool.base64UrlSafeToObj(urlHash);
                        self_.openWindow(url);
                    });
                    $(document).on("click", ".spyd-win-tab-close", function (e) {
                        let urlHash = $(this).parent()[0].dataset.urlhash;
                        self_.closeWindow(urlHash);
                        e.stopPropagation();
                    });
                    $(document).on("click", ".spyd-win-tab-reload", function (e) {
                        let urlHash = $(this).parent()[0].dataset.urlhash;
                        let url = spydTool.base64UrlSafeToObj(urlHash);
                        self_.openWindow(url, "", true);
                        e.stopPropagation();
                    });
                },
                openWindow: (url, title, reload = false) => {
                    let urlHash = spydTool.objToBase64UrlSafe(url);
                    let windowFound = false;

                    cfg.$tabContainer.find(".spyd-win-tab").each((idx, elm) => {
                        if ($(elm)[0].dataset.urlhash === urlHash) {
                            windowFound = true;
                            $(elm).addClass("selected");
                            $(elm).find(".spyd-win-tab-reload").show();
                        }
                        else {
                            $(elm).removeClass("selected");
                            $(elm).find(".spyd-win-tab-reload").hide();
                        }
                    });

                    if (!windowFound) {
                        addWindow(url, title);
                    }

                    cfg.$windowContainer.find(".spyd-win-iframe").each((idx, elm) => {
                        if ($(elm)[0].dataset.urlhash === urlHash) {
                            $(elm).show();
                            if (reload) {
                                $(elm).attr("src", "about:blank");
                                $(elm).attr("src", url);
                            }
                        }
                        else {
                            $(elm).hide();
                        }
                    });

                    if (cfg.opened) {
                        cfg.opened();
                    }
                },
                closeWindow: async function (urlHash) {
                    let self_ = this;
                    let nextTabToShow = undefined;
                    let nextTabToShowBefore = undefined;
                    let nextTabToShowAfter = undefined;
                    let tabClosed = false;

                    let selectedTabClosed = false;

                    cfg.$tabContainer.find(".spyd-win-tab").each((idx, elm) => {

                        if ($(elm)[0].dataset.urlhash === urlHash) {
                            $(elm).remove();
                            cfg.$windowContainer.find(".spyd-win-iframe").each((idx, elm2) => {
                                if ($(elm2)[0].dataset.urlhash === urlHash) {
                                    $(elm2).remove();
                                }
                            });

                            if (cfg.closed) {
                                cfg.closed();
                            }

                            tabClosed = true;
                            selectedTabClosed = $(elm).hasClass("selected");
                        }
                        else {
                            //nextTabToShow = $(elm);
                            if (!tabClosed) {
                                nextTabToShowBefore = $(elm);
                            }
                            else if (nextTabToShowAfter === undefined) {
                                nextTabToShowAfter = $(elm);
                            }
                        }
                    });

                    if (nextTabToShowAfter) {
                        nextTabToShow = nextTabToShowAfter;
                    }
                    else {
                        nextTabToShow = nextTabToShowBefore;
                    }

                    if (selectedTabClosed) {
                        if (nextTabToShow) {
                            let urlHash_ = nextTabToShow[0].dataset.urlhash;
                            let url = spydTool.base64UrlSafeToObj(urlHash_);
                            self_.openWindow(url);
                        }
                    }
                }
            }
        })()
    }
};