<template>
    <v-app class="blue">
        <v-content id="content" v-windowtouch>
            <v-layout>
                <v-flex>
                    <v-list v-if="!showSettings" class="yellow lighten-2" style="padding:0">
                        <v-list-tile style="margin-top:-96px">
                            <v-list-tile-content>
                                <v-flex style="width:100%">
                                    <v-card class="yellow lighten-2">
                                        <v-card-text class="px-0 pb-2">
                                            <span v-if="showGroups">Move to Settings</span>
                                            <span v-else>Back to Groups</span>
                                        </v-card-text>
                                    </v-card>
                                </v-flex>
                            </v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile>
                            <v-list-tile-content>
                                <v-flex style="width:100%">
                                    <v-text-field
                                        v-model="newValue"
                                        placeholder="New Item"
                                        ref="newTextfield"
                                        @blur="addItem"
                                        >
                                    </v-text-field>
                                </v-flex>
                            </v-list-tile-content>
                        </v-list-tile>
                        <draggable v-model="items" @start="dragStart" @end="dragEnd">
                            <v-list-tile
                                v-for="(item, idx) in items"
                                :key="idx"
                                v-listtouch="item"
                                class="blue" dark
                                >
                                <v-list-tile-content>
                                    <v-flex style="width:100%">
                                        <v-text-field
                                            v-model="item.value"
                                            @blur="updateItem(item)"
                                            @click.stop="switchInput(item)"
                                            >
                                            <v-card flat slot="append-outer" v-if="item.isGroup" class="blue">
                                                <v-card-text class="pt-2 pb-0 px-0" @click.stop="switchTasks(item.id)">{{ item.taskCount }}</v-card-text>
                                            </v-card>
                                        </v-text-field>
                                    </v-flex>
                                </v-list-tile-content>
                            </v-list-tile>
                        </draggable>
                    </v-list>
                    <v-list v-else id="settings" class="blue-grey" dark style="padding:0">
                        <v-list-tile style="margin-top:-48px">
                            <v-list-tile-content>
                                <v-flex style="width:100%">
                                    <v-card class="blue-grey">
                                        <v-card-text class="px-0 pb-2">
                                            <span>Back to Groups</span>
                                        </v-card-text>
                                    </v-card>
                                </v-flex>
                            </v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile @click.stop="removeAllData">
                            <v-list-tile-content>
                                <v-flex style="width:100%">
                                    <v-card class="blue-grey">
                                        <v-card-text class="px-0 pb-2">
                                            <span>Reset Data</span>
                                        </v-card-text>
                                    </v-card>
                                </v-flex>
                            </v-list-tile-content>
                        </v-list-tile>
                    </v-list>
                </v-flex>
            </v-layout>
        </v-content>
    </v-app>
</template>

<script>
/* eslint-disable no-console */

import db from './db';
import draggable from 'vuedraggable';

export default {
    name: 'App',
    data () {
        return {
            items: [],
            showGroups: true,
            preventFlg: false,
            newValue: '',
            selectedGroupId: null,
            showSettings: false,
            touchEventCancel: false,
        }
    },
    components: {
        draggable,
    },
    mounted () {
        this.fetchGroups();
    },
    directives: {
        listtouch: {
            inserted: (el, binding, vnode) => {
                let touchPosition = {
                    startX: null,
                    startY: null,
                    currentX: null,
                    currentY: null,
                };
                let halfWidth = parseInt(window.innerWidth / 2);
                let thresholdHeight = 30;
                el.addEventListener('touchstart', event => {
                    if (event.targetTouches.length == 1) {
                        let touch = event.targetTouches[0];
                        touchPosition.startX = touch.pageX;
                        touchPosition.startY = touch.pageY;
                    }
                });
                el.addEventListener('touchmove', event => {
                    if (event.targetTouches.length == 1) {
                        let touch = event.targetTouches[0];
                        touchPosition.currentX = touch.pageX;
                        touchPosition.currentY = touch.pageY;
                        if (Math.abs(touchPosition.currentY - touchPosition.startY) < thresholdHeight) {
                            if (touchPosition.currentX < touchPosition.startX) {
                                el.style['margin-left'] = '0px';
                                el.style['margin-right'] = parseInt(touchPosition.startX - touchPosition.currentX) + 'px';
                            } else {
                                el.style['margin-left'] = parseInt(touchPosition.currentX - touchPosition.startX) + 'px';
                                el.style['margin-right'] = '0px';
                            }
                        }
                    }
                });
                el.addEventListener('touchend', () => {
                    el.style['margin-left'] = '0px';
                    el.style['margin-right'] = '0px';
                    if (!touchPosition.startX || !touchPosition.startY || !touchPosition.currentX || !touchPosition.currentY) {
                        touchPosition.startX = null;
                        touchPosition.startY = null;
                        touchPosition.currentX = null;
                        touchPosition.currentY = null;
                        return;
                    }
                    // Remove item
                    if (touchPosition.currentX < touchPosition.startX && touchPosition.startX - touchPosition.currentX > halfWidth
                        && Math.abs(touchPosition.currentY - touchPosition.startY) < thresholdHeight) {
                        touchPosition.startX = null;
                        touchPosition.startY = null;
                        touchPosition.currentX = null;
                        touchPosition.currentY = null;
                        return vnode.context.removeItem(binding.value);
                    }
                    touchPosition.startX = null;
                    touchPosition.startY = null;
                    touchPosition.currentX = null;
                    touchPosition.currentY = null;
                });
            }
        },
        windowtouch: {
            inserted: (el, binding, vnode) => {
                let touchPosition = {
                    startX: null,
                    startY: null,
                    currentX: null,
                    currentY: null,
                };
                let thresholdWidth = 50;
                el.addEventListener('touchstart', event => {
                    if (vnode.context.touchEventCancel) return;

                    if (event.targetTouches.length == 1) {
                        let touch = event.targetTouches[0];
                        touchPosition.startX = touch.pageX;
                        touchPosition.startY = touch.pageY;
                    }
                });
                el.addEventListener('touchmove', event => {
                    if (vnode.context.touchEventCancel) return;

                    if (event.targetTouches.length == 1) {
                        let touch = event.targetTouches[0];
                        touchPosition.currentX = touch.pageX;
                        touchPosition.currentY = touch.pageY;
                        if (Math.abs(touchPosition.currentX - touchPosition.startX) < thresholdWidth) {
                            if (touchPosition.currentY > touchPosition.startY) {
                                let $settings = document.getElementById('settings');
                                let paddingTop = parseInt(touchPosition.currentY - touchPosition.startY);
                                if ($settings) {
                                    if (paddingTop > 48) {
                                        paddingTop = 48;
                                    }
                                } else {
                                    if (paddingTop > 96) {
                                        paddingTop = 96;
                                    }
                                }
                                el.style['padding-top'] = paddingTop + 'px';
                            }
                        }
                    }
                });
                el.addEventListener('touchend', () => {
                    if (vnode.context.touchEventCancel) return;

                    // Move page or
                    // Display new item input
                    if (!touchPosition.startX || !touchPosition.startY || !touchPosition.currentX || !touchPosition.currentY) {
                        touchPosition.startX = null;
                        touchPosition.startY = null;
                        touchPosition.currentX = null;
                        touchPosition.currentY = null;
                        return;
                    }
                    if (Math.abs(touchPosition.currentX - touchPosition.startX) < thresholdWidth) {
                        if (touchPosition.currentY > touchPosition.startY) {
                            let paddingTop = parseInt(touchPosition.currentY - touchPosition.startY);
                            touchPosition.startX = null;
                            touchPosition.startY = null;
                            touchPosition.currentX = null;
                            touchPosition.currentY = null;
                            return vnode.context.windowTouchEndEvent(paddingTop);
                        }
                    }
                    el.style['padding-top'] = '0px';
                    touchPosition.startX = null;
                    touchPosition.startY = null;
                    touchPosition.currentX = null;
                    touchPosition.currentY = null;
                });
            }
        }
    },
    methods: {
        groupToItem (group) {
            return {
                id: group.id,
                value: group.name,
                sort: group.sort,
                isGroup: true,
                isEditing: false,
                taskCount: 0,
            };
        },
        itemToGroup (item) {
            return {
                id: item.id,
                name: item.value,
                sort: item.sort,
            };
        },
        taskToItem (task) {
            return {
                id: task.id,
                value: task.text,
                sort: task.sort,
                groupsId: task.groups_id,
                isGroup: false,
                isEditing: false,
            };
        },
        itemToTask (item) {
            return {
                id: item.id,
                text: item.value,
                sort: item.sort,
                groups_id: item.groupsId,
            };
        },
        switchGroups () {
            if (this.showGroups) {
                return;
            }
            this.resetWindow();
            this.showGroups = true;
            this.showSettings = false;
            this.selectedGroupId = null;
            this.fetchGroups();
        },
        switchTasks (id) {
            if (!this.showGroups && this.selectedGroupId) {
                return;
            }
            if (this.preventFlg) {
                this.preventFlg = false;
                return;
            }
            this.showGroups = false;
            this.selectedGroupId = id;
            this.fetchTasks(id);
        },
        switchSettings () {
            this.resetWindow();
            this.showSettings = true;
            this.showGroups = false;
        },
        focusNewTextfield () {
            let el = document.getElementById('content');
            el.style['padding-top'] = '48px';
            this.$refs.newTextfield.focus();
        },
        switchInput (item) {
            if (this.preventFlg) {
                this.preventFlg = false;
                return;
            }
            item.isEditing = true;
        },
        fetchGroups () {
            this.items = []; // All clear necessary for remove item
            db.groups.where('deleted').equals(0).reverse().sortBy('sort').then( groups => {
                this.items = groups.map( group => { return this.groupToItem(group); } );
                let taskCounts = {};
                db.tasks.where('deleted').equals(0).toArray().then( tasks => {
                    for (let i = 0; i < tasks.length; i++) {
                        if (!taskCounts[tasks[i].groups_id]) {
                            taskCounts[tasks[i].groups_id] = 0;
                        }
                        taskCounts[tasks[i].groups_id]++;
                    }
                    for (let i = 0; i < this.items.length; i++) {
                        if (taskCounts[this.items[i].id]) {
                            this.items[i].taskCount = taskCounts[this.items[i].id];
                        }
                    }
                });
            }).catch( error => {
                console.log(error);
            });
        },
        fetchTasks (id) {
            this.items = []; // All clear necessary for remove item
            db.tasks.where({ deleted: 0, groups_id: id }).reverse().sortBy('sort').then( tasks => {
                this.items = tasks.map( task => { return this.taskToItem(task); } );
            }).catch( error => {
                console.log(error);
            });
        },
        updateGroup (item) {
            let group = this.itemToGroup(item);
            db.groups.update(group.id, group).then( () => {
                item.isEditing = false;
                this.fetchGroups();
            }).catch( error => {
                console.log(error);
            });
        },
        updateTask (item) {
            let task = this.itemToTask(item);
            db.tasks.update(task.id, task).then( () => {
                item.isEditing = false;
                this.fetchTasks(task.groups_id);
            }).catch( error => {
                console.log(error);
            });
        },
        updateItem (item) {
            this.preventFlg = true;
            if (!this.showGroups && this.selectedGroupId) {
                this.updateTask(item);
            } else {
                this.updateGroup(item);
            }
        },
        resetWindow () {
            let el = document.getElementById('content');
            el.style['padding-top'] = 0;
            this.newValue = '';
        },
        addGroup () {
            let group = {
                name: this.newValue,
                sort: this.items.length + 1,
                deleted: 0,
            };
            db.groups.add(group).then( () => {
                this.resetWindow();
                this.fetchGroups();
            }).catch( error => {
                console.log(error);
            });
        },
        addTask () {
            let task = {
                groups_id: this.selectedGroupId,
                text: this.newValue,
                sort: this.items.length + 1,
                deleted: 0,
            };
            db.tasks.add(task).then( () => {
                this.resetWindow();
                this.fetchTasks(this.selectedGroupId);
            }).catch( error => {
                console.log(error);
            });
        },
        addItem () {
            this.preventFlg = true;
            if (!this.newValue) {
                this.resetWindow();
                return;
            }
            if (!this.showGroups && this.selectedGroupId) {
                this.addTask();
            } else {
                this.addGroup();
            }
        },
        removeGroup (item) {
            let group = this.itemToGroup(item);
            group.deleted = 1;
            db.transaction('rw', db.groups, () => {
                db.groups.update(group.id, group);
                db.groups.where('sort').above(group.sort).each( grp => {
                    db.groups.update(grp.id, { sort: grp.sort - 1 });
                });
            }).then( () => {
                this.fetchGroups();
            }).catch( error => {
                console.log(error);
            });
        },
        removeTask (item) {
            let task = this.itemToTask(item);
            task.deleted = 1;
            db.transaction('rw', db.tasks, () => {
                db.tasks.update(task.id, task);
                db.tasks.where('groups_id').equals(task.groups_id).filter( tsk => {
                    return tsk.sort > task.sort;
                }).each( tsk => {
                    db.tasks.update(tsk.id, { sort: tsk.sort - 1 });
                });
            }).then( () => {
                this.fetchTasks(task.groups_id);
            }).catch( error => {
                console.log(error);
            });
        },
        removeItem (item) {
            if (!this.showGroups && this.selectedGroupId) {
                if (window.confirm('Remove task OK?')) {
                    this.removeTask(item);
                }
            } else {
                if (window.confirm('Remove group OK?')) {
                    this.removeGroup(item);
                }
            }
        },
        windowTouchEndEvent (paddingTop) {
            if (this.showSettings) {
                if (paddingTop > 48) {
                    this.switchGroups();
                } else {
                    this.resetWindow();
                }
            } else if (this.showGroups && !this.selectedGroupId) {
                if (paddingTop > 96) {
                    this.switchSettings();
                } else if (paddingTop > 48) {
                    this.focusNewTextfield();
                } else {
                    this.resetWindow();
                }
            } else {
                if (paddingTop > 96) {
                    this.switchGroups();
                } else if (paddingTop > 48) {
                    this.focusNewTextfield();
                } else {
                    this.resetWindow();
                }
            }
        },
        removeAllData () {
            if (!window.confirm('Reset data OK?')) {
                return;
            }
            db.delete().then( () => {
                alert('Reset Data');
                location.reload();
            }).catch( error => {
                console.log(error);
                alert('Error');
            });
        },
        sortGroup (oldSort, newSort) {
            db.transaction('rw', db.groups, () => {
                db.groups.where({ deleted: 0, sort: oldSort }).first( group => {
                    db.groups.update(group.id, { sort: newSort });
                    if (oldSort < newSort) {
                        db.groups.where({ deleted: 0 }).filter( grp => {
                            return group.id != grp.id;
                        }).filter( grp => {
                            return oldSort < grp.sort && grp.sort <= newSort;
                        }).each( grp => {
                            db.groups.update(grp.id, { sort: grp.sort - 1 });
                        });
                    } else {
                        db.groups.where({ deleted: 0 }).filter( grp => {
                            return group.id != grp.id;
                        }).filter( grp => {
                            return oldSort > grp.sort && grp.sort >= newSort;
                        }).each( grp => {
                            db.groups.update(grp.id, { sort: grp.sort + 1 });
                        });
                    }
                });
            }).then( () => {
                this.fetchGroups();
            }).catch( error => {
                console.log(error);
            });
        },
        sortTask (oldSort, newSort) {
            db.transaction('rw', db.tasks, () => {
                db.tasks.where({ deleted: 0, sort: oldSort, groups_id: this.selectedGroupId }).first( task => {
                    db.tasks.update(task.id, { sort: newSort });
                    if (oldSort < newSort) {
                        db.tasks.where({ deleted: 0, groups_id: this.selectedGroupId }).filter( tsk => {
                            return task.id != tsk.id;
                        }).filter( tsk => {
                            return oldSort < tsk.sort && tsk.sort <= newSort;
                        }).each( tsk => {
                            db.tasks.update(tsk.id, { sort: tsk.sort - 1 });
                        });
                    } else {
                        db.tasks.where({ deleted: 0, groups_id: this.selectedGroupId }).filter( tsk => {
                            return task.id != tsk.id;
                        }).filter( tsk => {
                            return oldSort > tsk.sort && tsk.sort >= newSort;
                        }).each( tsk => {
                            db.tasks.update(tsk.id, { sort: tsk.sort + 1 });
                        });
                    }
                });
            }).then( () => {
                this.fetchTasks(this.selectedGroupId);
            }).catch( error => {
                console.log(error);
            });
        },
        sort (oldIndex, newIndex) {
            if (oldIndex == newIndex) return;

            if (!this.showGroups && this.selectedGroupId) {
                this.sortTask(this.items.length - oldIndex, this.items.length - newIndex);
            } else {
                this.sortGroup(this.items.length - oldIndex, this.items.length - newIndex);
            }
        },
        dragStart () {
            this.touchEventCancel = true;
        },
        dragEnd (event) {
            this.sort(event.oldIndex, event.newIndex);
            this.touchEventCancel = false;
        },
    }
}
</script>

<style>
.theme--light.v-list .v-list__tile--link:hover, .theme--dark.v-list .v-list__tile--link:hover {
    background: none;
}
</style>
