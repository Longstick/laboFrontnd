// 维修管理系统主体

import { getIssueDetail, getIssueList, getResourceID, getTodoList, issueTableRule } from '@/services/api';
import { PageContainer, ProTable, ProCard, TableDropdown, StatisticCard } from '@ant-design/pro-components';

import { Button, Tag, Badge, Space, Modal, Popconfirm } from 'antd';
import { FormattedMessage, useModel } from '@umijs/max';
import type { ProColumns, ActionType, ColumnsState } from '@ant-design/pro-components';

import React, { Children, useRef, useState } from 'react';
import RcResizeObserver from 'rc-resize-observer';

import ProcessDrawer from './components/ProcessDrawer';
import CreateNew from './components/CreateNew';
import styles from './index.less';
import { failureTypeLabel, priorityList, staticGroup, statusList } from './struct';
import ButtonGroup from 'antd/lib/button/button-group';
import DetailCard from './components/DetailCard';
import DraftsTable from './components/DraftsTable';

const { Statistic } = StatisticCard

const Repairment: React.FC = () => {
    const [responsive, setResponsive] = useState<boolean>(false);
    const [currentRow, setCurrentRow] = useState<API.IssueInfo>();
    const [activeKey, setActiveKey] = useState<string>('all');
    const [selectedRowsState, setSelectedRows] = useState<API.IssueInfo[]>([]);
    const [rowSelect, setRowSelect] = useState<boolean>(false);
    const [processDrawerOpen, setProcessDrawer] = useState<boolean>(false);
    const [detailModalOpen, setModalOpen] = useState<boolean>(false);
    const [columnsStateMap, setColumnsStateMap] = useState<Record<string, ColumnsState>>({
        object: { show: false },
        issueDescription: { show: false },
    });
    const { initialState } = useModel('@@initialState');
    const actionRef = useRef<ActionType>();

    const onCloseProcessDrawer = () => {
        setProcessDrawer(false);
    };

    const onCloseDetailModal = () => {
        setModalOpen(false);
    };

    const tabs = [
        {
            key: 'all',
            title: '所有工单',
            value: 12334,
        },
        {
            key: 'to-do',
            title: '我待办的',
            value: 1151,
        },
        {
            key: 'myCompleted',
            title: '我参与的',
            value: 213,
        },
        {
            key: 'mySubmission',
            title: '我创建的',
            value: 152,
        },
        {
            key: 'drafts',
            title: '草稿箱',
            value: 223,
        },
    ]

    const columns: ProColumns<API.IssueInfo>[] = [
        {
            key: 'identifier',
            title: '工单ID',
            dataIndex: 'identifier',
            sorter: (a, b) => {
                return Number(a.identifier) - Number(b.identifier)
            }
            // search: false,            
            // width: '10%',
        },
        {
            key: 'title',
            title: '工单标题',
            dataIndex: 'title',
            ellipsis: true,
            search: false,
            width: 300,
        },
        // {
        //     key: 'description',
        //     title: '工单描述',
        //     dataIndex: 'description',
        //     valueType: 'textarea',
        //     ellipsis: true,
        //     search: false,
        // },
        {
            key: 'resource',
            title: '工作对象',
            dataIndex: ['resource', 'name'],
            ellipsis: true,
            // search: false,
            request: getResourceID,
            fieldProps: {

                showSearch: true,
                // showArrow: false,
                debounceTime: 500,
            },
            render: (text, record, _, action) => {
                return `${record.resource?.identifier} ${record.resource?.name}`
            }
        },
        {
            key: 'type',
            title: '故障类型',
            dataIndex: 'type',
            valueType: 'select',
            valueEnum: failureTypeLabel,
            width: '8%',
            render: (_, record) => (
                <Tag color={failureTypeLabel[record.type!].color}>
                    {failureTypeLabel[record.type!].text}
                </Tag>
            ),
            fieldProps: {
                dropdownMatchSelectWidth: false,
            },
        },
        {
            key: 'priority',
            title: '优先级',
            dataIndex: 'priority',
            valueType: 'select',
            valueEnum: priorityList,
            width: '8%',
            render: (_, record) => (
                <Tag color={priorityList[record?.priority ?? 0].color}>
                    {priorityList[record?.priority ?? 0].text}
                </Tag>
            ),
            fieldProps: {
                dropdownMatchSelectWidth: false,
            },
        },

        {
            key: 'finish_date',
            title: '预期时限',
            dataIndex: 'finish_date',
            valueType: 'dateTime',
            sorter: (a, b) => {
                return new Date(a.finish_date!).getTime() - new Date(b.finish_date!).getTime()
            }
        },
        {
            key: 'create_time',
            title: '创建时间',
            dataIndex: 'create_time',
            search: false,
            valueType: 'dateTime',
            sorter: (a, b) => {
                const atime = new Date(a.create_time!).getTime();
                const btime = new Date(b.create_time!).getTime();
                return atime - btime
            },
            defaultSortOrder: 'descend',
            // hideInTable: true
        },

        {
            key: 'status',
            title: '状态',
            dataIndex: 'status',
            valueType: 'select',
            valueEnum: statusList,
            width: 120,
            fieldProps: {
                dropdownMatchSelectWidth: false,
            }
        },
        {
            key: 'tableOptions',
            title: (
                <FormattedMessage id="pages.repairment.searchTable.tableOptions" defaultMessage="Options" />
            ),
            dataIndex: 'tableOptions',
            search: false,
            width: responsive ? 60 : 200,
            fixed: 'right',
            align: 'center',
            render: (text, record, _, action) => {
                const len = record.has_person?.length

                const onDetailButtonClick = () => {
                    console.log(record)
                    setCurrentRow(record);
                    setModalOpen(true);
                }

                const onProcessButtonClick = () => {
                    setCurrentRow(record);
                    setProcessDrawer(true);
                }

                return responsive ? (
                    <TableDropdown
                        key="actionGroup"
                        onSelect={() => action?.reload()}
                        menus={[
                            {
                                key: 'detail',
                                name: '详细信息',
                                onClick: onDetailButtonClick
                            },
                            {
                                key: 'dropdownProcess',
                                name:
                                    record.has_person[len - 1] === initialState?.userInfo?.id && record.status != 1
                                        ? '点击处理'
                                        : '查看流程',
                                onClick: onProcessButtonClick
                            },
                        ]}
                    />
                ) : (
                    <>
                        {/* <a onClick={onDetailButtonClick}>详细信息</a> */}
                        <a onClick={onProcessButtonClick}>
                            {record.has_person[len - 1] === initialState?.userInfo?.id && record.status !== 1 ? '点击处理' : '查看流程'
                            }
                        </a>
                        <Popconfirm title="确认要关闭订单吗">
                            {initialState?.userInfo?.id === record.has_person[0] && record.status != 1
                                && <>&nbsp;&nbsp;&nbsp;&nbsp;<a>关闭工单</a></>}
                        </Popconfirm>
                    </>
                );
            },
        },
    ];

    return (
        <RcResizeObserver
            key="resize-observer"
            onResize={(offset) => {
                setResponsive(offset.width <= 576);
            }}
        >
            <PageContainer>
                <ProCard.Group
                    ghost
                    gutter={[24, 12]}
                    className={styles.statisticsBaseCard}
                    direction={responsive ? 'column' : 'row'}
                >
                    {function tabsRender() {
                        return tabs.map((item) =>
                            <StatisticCard
                                key='tabs'
                                statistic={{
                                    title: <div className={styles.StatisticTitle}>{item.title}</div>,
                                    value: item.value,
                                    valueStyle: {
                                        fontFamily: 'Alimama ShuHeiTi_Bold',
                                        fontSize: 18,
                                        // float: 'right',
                                    },
                                    suffix: <div style={{ fontFamily: 'Alimama ShuHeiTi_Bold', fontSize: 18 }}>项</div>,
                                }}
                                hoverable
                                className={activeKey === item.key ? styles.isActive : styles.statisticsCard}
                                onClick={() => {
                                    setActiveKey(item.key)
                                    actionRef.current?.reloadAndRest?.();
                                }}
                            />
                        )
                    }()}
                </ProCard.Group>
                {activeKey !== 'drafts' ? (
                    // 草稿箱单独渲染
                    <>
                        <ProTable<API.IssueInfo, API.PageParams>
                            columns={columns}
                            actionRef={actionRef}
                            request={{
                                all: getIssueList,
                                mySubmission: getTodoList,
                            }[activeKey]}
                            // tableLayout="auto"
                            rowKey="identifier"
                            defaultSize='large'
                            scroll={{ x: 1600 }}
                            rowSelection={
                                rowSelect ?
                                    {
                                        onChange: (_, selectedRows) => {
                                            setSelectedRows(selectedRows);
                                        },
                                        alwaysShowAlert: true,
                                    } : false
                            }
                            toolbar={{
                                title: <Space size={16}>
                                    <CreateNew type="newButton" tableActionRef={actionRef} />
                                    <ButtonGroup>
                                        <Button key="outputAll">
                                            导出全部
                                        </Button>

                                        {rowSelect ?
                                            <Button
                                                key='cancelOperate'
                                                // size='large'
                                                danger
                                                onClick={() => { setRowSelect(false) }}
                                            >取消操作</Button>
                                            :
                                            <Button
                                                key="outputSelected"
                                                // size="large"
                                                onClick={() => { setRowSelect(true) }}
                                            >批量操作</Button>
                                        }

                                    </ButtonGroup>
                                </Space>
                            }}
                            tableAlertOptionRender={({ selectedRowKeys, selectedRows, onCleanSelected }) => (
                                <Space size={24}>
                                    <a >批量导出</a>
                                    <a onClick={onCleanSelected}>取消选择</a>
                                </Space>
                            )}
                            columnsState={{
                                value: columnsStateMap,
                                onChange: setColumnsStateMap,
                            }}
                        />

                        <ProcessDrawer
                            responsive={responsive}
                            drawerOpen={processDrawerOpen}
                            onClose={onCloseProcessDrawer}
                            recordId={currentRow?.id}
                            tableActionRef={actionRef}
                        />

                        <Modal
                            open={detailModalOpen}
                            onCancel={onCloseDetailModal}
                            footer={null}
                            title={`工单 ${currentRow?.identifier}`}
                            width={800}
                        >
                            <DetailCard
                                responsive={responsive}
                                value={currentRow}
                            />
                        </Modal>
                    </>
                ) : (
                    <DraftsTable />
                )}
            </PageContainer>
        </RcResizeObserver>
    );
};

export default Repairment;
