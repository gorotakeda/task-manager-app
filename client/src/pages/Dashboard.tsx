import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Calendar, CheckCircle2, Circle, Clock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

type Priority = "low" | "medium" | "high";

const priorityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

const priorityLabels = {
  low: "低",
  medium: "中",
  high: "高",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority | undefined>();
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as Priority,
  });

  const utils = trpc.useUtils();
  const { data: tasks = [], isLoading } = trpc.tasks.list.useQuery(
    selectedPriority ? { priority: selectedPriority } : undefined
  );

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      setIsCreateDialogOpen(false);
      setNewTask({ title: "", description: "", dueDate: "", priority: "medium" });
      toast.success("タスクを作成しました");
    },
    onError: () => {
      toast.error("タスクの作成に失敗しました");
    },
  });

  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      setIsEditDialogOpen(false);
      setEditingTask(null);
      toast.success("タスクを更新しました");
    },
    onError: () => {
      toast.error("タスクの更新に失敗しました");
    },
  });

  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      setIsDeleteDialogOpen(false);
      setDeletingTaskId(null);
      toast.success("タスクを削除しました");
    },
    onError: () => {
      toast.error("タスクの削除に失敗しました");
    },
  });

  const toggleStatusMutation = trpc.tasks.toggleStatus.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      toast.success("ステータスを更新しました");
    },
    onError: () => {
      toast.error("ステータスの更新に失敗しました");
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast.error("タイトルを入力してください");
      return;
    }

    createMutation.mutate({
      title: newTask.title,
      description: newTask.description || undefined,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      priority: newTask.priority,
    });
  };

  const handleUpdateTask = () => {
    if (!editingTask || !editingTask.title.trim()) {
      toast.error("タイトルを入力してください");
      return;
    }

    updateMutation.mutate({
      id: editingTask.id,
      title: editingTask.title,
      description: editingTask.description || undefined,
      dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : null,
      priority: editingTask.priority,
    });
  };

  const handleDeleteTask = () => {
    if (deletingTaskId) {
      deleteMutation.mutate({ id: deletingTaskId });
    }
  };

  const handleToggleStatus = (taskId: number) => {
    toggleStatusMutation.mutate({ id: taskId });
  };

  const openEditDialog = (task: any) => {
    setEditingTask({
      id: task.id,
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm") : "",
      priority: task.priority,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (taskId: number) => {
    setDeletingTaskId(taskId);
    setIsDeleteDialogOpen(true);
  };

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const completedTasks = tasks.filter(t => t.status === "completed");

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">タスク管理</h1>
          <p className="text-muted-foreground mt-1">
            ようこそ、{user?.name || "ゲスト"}さん
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg" className="shadow-md">
          <Plus className="mr-2 h-5 w-5" />
          新しいタスク
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedPriority === undefined ? "default" : "outline"}
          onClick={() => setSelectedPriority(undefined)}
          size="sm"
        >
          すべて
        </Button>
        <Button
          variant={selectedPriority === "high" ? "default" : "outline"}
          onClick={() => setSelectedPriority("high")}
          size="sm"
        >
          高優先度
        </Button>
        <Button
          variant={selectedPriority === "medium" ? "default" : "outline"}
          onClick={() => setSelectedPriority("medium")}
          size="sm"
        >
          中優先度
        </Button>
        <Button
          variant={selectedPriority === "low" ? "default" : "outline"}
          onClick={() => setSelectedPriority("low")}
          size="sm"
        >
          低優先度
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Circle className="h-5 w-5 text-primary" />
              未完了のタスク ({pendingTasks.length})
            </h2>
            {pendingTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  未完了のタスクはありません
                </CardContent>
              </Card>
            ) : (
              pendingTasks.map(task => (
                <Card key={task.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        {task.description && (
                          <CardDescription className="mt-2">{task.description}</CardDescription>
                        )}
                      </div>
                      <Badge className={priorityColors[task.priority as Priority]}>
                        {priorityLabels[task.priority as Priority]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      {task.dueDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          期限: {format(new Date(task.dueDate), "yyyy年MM月dd日 HH:mm")}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(task.id)}
                          className="flex-1"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          完了にする
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(task)}
                        >
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(task.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              完了したタスク ({completedTasks.length})
            </h2>
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  完了したタスクはありません
                </CardContent>
              </Card>
            ) : (
              completedTasks.map(task => (
                <Card key={task.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-through decoration-muted-foreground">
                          {task.title}
                        </CardTitle>
                        {task.description && (
                          <CardDescription className="mt-2">{task.description}</CardDescription>
                        )}
                      </div>
                      <Badge className={priorityColors[task.priority as Priority]}>
                        {priorityLabels[task.priority as Priority]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(task.id)}
                        className="flex-1"
                      >
                        <Circle className="mr-2 h-4 w-4" />
                        未完了に戻す
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(task.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>新しいタスクを作成</DialogTitle>
            <DialogDescription>タスクの詳細を入力してください</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="タスクのタイトル"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="タスクの詳細説明"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">期限</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={newTask.dueDate}
                onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">優先度</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value: Priority) => setNewTask({ ...newTask, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreateTask} disabled={createMutation.isPending}>
              {createMutation.isPending ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>タスクを編集</DialogTitle>
            <DialogDescription>タスクの詳細を更新してください</DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">タイトル *</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="タスクのタイトル"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">説明</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                  placeholder="タスクの詳細説明"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">期限</Label>
                <Input
                  id="edit-dueDate"
                  type="datetime-local"
                  value={editingTask.dueDate}
                  onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">優先度</Label>
                <Select
                  value={editingTask.priority}
                  onValueChange={(value: Priority) =>
                    setEditingTask({ ...editingTask, priority: value })
                  }
                >
                  <SelectTrigger id="edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateTask} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>タスクを削除しますか?</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。タスクが完全に削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
