<template>
    <v-app class="blue">
        <v-content id="content" v-windowtouch>
            <v-layout>
                <v-flex>
                    <v-list class="yellow lighten-2" style="padding:0">
                        <v-list-tile style="margin-top:-48px">
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
                        <template v-for="(item, idx) in items">
                            <v-list-tile
                                :key="idx"
                                v-listtouch="item"
                                class="blue" dark
                                @click="switchTasks(item.id)"
                                >
                                <v-list-tile-content>
                                    <v-flex style="width:100%">
                                        <v-text-field
                                            v-if="item.isEditing"
                                            v-model="item.value"
                                            ref="textfield"
                                            @blur="updateItem(item)"
                                            >
                                        </v-text-field>
                                        <v-card class="blue" dark v-else>
                                            <v-card-text class="px-0 pb-2">
                                                <span @click.stop="switchInput(item)">{{ item.value }}</span>
                                            </v-card-text>
                                        </v-card>
                                    </v-flex>
                                </v-list-tile-content>
                            </v-list-tile>
                        </template>
                    </v-list>
                </v-flex>
            </v-layout>
        </v-content>
    </v-app>
</template>

<script>
/* eslint-disable no-console */

import db from './db';

export default {
    name: 'App',
    data () {
        return {
            items: [],
            showGroups: true,
            preventFlg: false,
            newValue: '',
            selectedGroupId: null,
        }
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
                    // Remove item
                    if (touchPosition.currentX < touchPosition.startX && touchPosition.startX - touchPosition.currentX > halfWidth
                        && Math.abs(touchPosition.currentY - touchPosition.startY) < thresholdHeight) {
                        return vnode.context.removeItem(binding.value);
                    }
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
                        if (Math.abs(touchPosition.currentX - touchPosition.startX) < thresholdWidth) {
                            if (touchPosition.currentY > touchPosition.startY) {
                                let paddingTop = parseInt(touchPosition.currentY - touchPosition.startY);
                                if (paddingTop > 100) {
                                    paddingTop = 100;
                                }
                                el.style['padding-top'] = paddingTop + 'px';
                            }
                        }
                    }
                });
                el.addEventListener('touchend', () => {
                    // Display new item input
                    if (Math.abs(touchPosition.currentX - touchPosition.startX) < thresholdWidth) {
                        if (touchPosition.currentY > touchPosition.startY) {
                            let paddingTop = parseInt(touchPosition.currentY - touchPosition.startY);
                            return vnode.context.windowTouchendEvent(paddingTop);
                        }
                    }
                    el.style['padding-top'] = '0px';
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
            this.selectedGroupId = null;
            this.fetchGroups();
        },
        switchTasks (id) {
            if (this.preventFlg) {
                this.preventFlg = false;
                return;
            }
            this.showGroups = false;
            this.selectedGroupId = id;
            this.fetchTasks(id);
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
            this.$nextTick( () => this.$refs.textfield[0].focus() );
        },
        fetchGroups () {
            this.items = []; // All clear necessary for remove item
            db.groups.where('deleted').equals(0).reverse().sortBy('sort').then( groups => {
                this.items = groups.map( group => { return this.groupToItem(group); } );
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
                this.removeTask(item);
            } else {
                this.removeGroup(item);
            }
        },
        windowTouchendEvent (paddingTop) {
            if (!this.showGroups && this.selectedGroupId) {
                if (paddingTop > 200) {
                    this.switchGroups();
                } else if (paddingTop > 48) {
                    this.focusNewTextfield();
                } else {
                    this.resetWindow();
                }
            } else {
                if (paddingTop > 48) {
                    this.focusNewTextfield();
                } else {
                    this.resetWindow();
                }
            }
        },
    }
}
</script>

<style>
.theme--light.v-list .v-list__tile--link:hover {
    background: none;
}
</style>
