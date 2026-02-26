import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertNoteSchema } from "@shared/schema";
import type { Note } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Edit, Star, StickyNote, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formSchema = insertNoteSchema.pick({
    title: true,
    content: true,
    color: true,
    favorite: true,
});

type NoteFormData = z.infer<typeof formSchema>;

const colors = [
    { value: "default", label: "Padrão", class: "bg-card border-border" },
    { value: "red", label: "Vermelho", class: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
    { value: "green", label: "Verde", class: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
    { value: "blue", label: "Azul", class: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
    { value: "yellow", label: "Amarelo", class: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800" },
    { value: "purple", label: "Roxo", class: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" },
];

export default function NotesPage() {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [editingNote, setEditingNote] = React.useState<Note | null>(null);
    const [searchTerm, setSearchTerm] = React.useState("");
    const { toast } = useToast();

    const { data: notes, isLoading } = useQuery<Note[]>({
        queryKey: ["/api/notes"],
    });

    const form = useForm<NoteFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            content: "",
            color: "default",
            favorite: false,
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: NoteFormData) => apiRequest("POST", "/api/notes", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
            setIsDialogOpen(false);
            form.reset();
            toast({ title: "Sucesso", description: "Anotação criada." });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao criar anotação.", variant: "destructive" }),
    });

    const updateMutation = useMutation({
        mutationFn: (data: NoteFormData & { id: string }) =>
            apiRequest("PATCH", `/api/notes/${data.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
            setIsDialogOpen(false);
            setEditingNote(null);
            form.reset();
            toast({ title: "Sucesso", description: "Anotação atualizada." });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiRequest("DELETE", `/api/notes/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
            toast({ title: "Sucesso", description: "Anotação excluída." });
        },
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: (note: Note) =>
            apiRequest("PATCH", `/api/notes/${note.id}`, { favorite: !note.favorite }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
        },
    });

    const onSubmit = (data: NoteFormData) => {
        if (editingNote) {
            updateMutation.mutate({ ...data, id: editingNote.id });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEdit = (note: Note) => {
        setEditingNote(note);
        form.reset({
            title: note.title,
            content: note.content || "",
            color: note.color || "default",
            favorite: note.favorite || false,
        });
        setIsDialogOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingNote(null);
            form.reset({
                title: "",
                content: "",
                color: "default",
                favorite: false,
            });
        }
    };

    const filteredNotes = notes?.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
        if (a.favorite === b.favorite) {
            return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
        }
        return a.favorite ? -1 : 1;
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <StickyNote className="h-8 w-8 text-primary" />
                        Anotações
                    </h1>
                    <p className="text-muted-foreground">Gerencie suas ideias e lembretes</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> Nova Anotação
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm bg-background/50 border rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar anotações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {isLoading ? (
                    <div>Carregando...</div>
                ) : filteredNotes?.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-10">
                        Nenhuma anotação encontrada. Crie uma nova!
                    </div>
                ) : filteredNotes?.map((note) => {
                    const colorStyle = colors.find(c => c.value === note.color)?.class || colors[0].class;
                    return (
                        <Card key={note.id} className={`group relative transition-all duration-200 hover:shadow-md ${colorStyle}`}>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg font-semibold leading-none">{note.title}</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-6 w-6 -mr-2 ${note.favorite ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground/30 hover:text-yellow-500 opacity-0 group-hover:opacity-100"}`}
                                        onClick={(e) => { e.stopPropagation(); toggleFavoriteMutation.mutate(note); }}
                                    >
                                        <Star className={`h-4 w-4 ${note.favorite ? "fill-current" : ""}`} />
                                    </Button>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {/* Fallback caso date-fns falhe ou seja removida: new Date(...).toLocaleDateString() */}
                                    {format(new Date(note.updatedAt || note.createdAt || new Date()), "d 'de' MMMM, yyyy", { locale: ptBR })}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2 min-h-[100px]">
                                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(note)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteMutation.mutate(note.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingNote ? "Editar Anotação" : "Nova Anotação"}</DialogTitle>
                        <DialogDescription>As anotações são salvas automaticamente no sistema.</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Título da nota" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Conteúdo</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} value={field.value || ""} placeholder="Escreva aqui..." rows={5} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cor</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || "default"}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione uma cor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {colors.map((color) => (
                                                    <SelectItem key={color.value} value={color.value}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-4 h-4 rounded-full border ${color.class.split(" ")[0]}`} />
                                                            {color.label}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
                                <Button type="submit">{editingNote ? "Salvar" : "Criar"}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
