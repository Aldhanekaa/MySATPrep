"use client";
import {
  BookmarkIcon,
  EllipsisIcon,
  Search,
  Plus,
  Pencil,
  Trash2,
  Folder,
} from "lucide-react";
import { Button } from "./button";
import { SavedQuestions, SavedQuestion } from "@/types/savedQuestions";
import { SavedCollections, SavedCollection } from "@/types/savedCollections";
import { QuestionById_Data } from "@/types";
import { playSound } from "@/lib/playSound";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useState, useId } from "react";

interface SaveButtonProps {
  question: QuestionById_Data;
  assessment: string;
  isQuestionSaved: boolean;
  savedQuestions: SavedQuestions;
  setSavedQuestions: (value: SavedQuestions) => void;
}
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "./input";
import { DropdownMenuLabel, DropdownMenuSeparator } from "./dropdown-menu";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./dialog";
import { toast } from "sonner";

export function SaveButton({
  question,
  assessment,
  isQuestionSaved,
  savedQuestions,
  setSavedQuestions,
}: SaveButtonProps) {
  const id = useId();
  const [savedCollections, setSavedCollections] =
    useLocalStorage<SavedCollections>("savedCollections", {});
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [editingCollection, setEditingCollection] =
    useState<SavedCollection | null>(null);
  const [hoverCardOpen, setHoverCardOpen] = useState(false);

  const questionId = question.question.questionId;
  const assessmentCollections = savedCollections[assessment] || [];

  // Migrate collections that don't have questionDetails (backward compatibility)
  const migratedCollections = assessmentCollections.map((collection) => {
    if (!collection.questionDetails) {
      return {
        ...collection,
        questionDetails: [], // Initialize empty array for legacy collections
      };
    }
    return collection;
  });

  // Filter collections based on search term
  const filteredCollections = migratedCollections.filter((collection) =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check which collections contain this question
  const questionCollections = migratedCollections.filter((collection) =>
    collection.questionIds.includes(questionId)
  );

  // Check if question is saved in any collection (this means it's also saved)
  const isQuestionInAnyCollection = questionCollections.length > 0;

  // The question is considered saved if it's either in savedQuestions OR in any collection
  const actualIsQuestionSaved = isQuestionSaved || isQuestionInAnyCollection;

  const handleSaveClick = () => {
    try {
      const updatedSavedQuestions = { ...savedQuestions };

      // Initialize array if it doesn't exist
      if (!updatedSavedQuestions[assessment]) {
        updatedSavedQuestions[assessment] = [];
      }

      // Check if question is already saved in savedQuestions
      const questionIndex = updatedSavedQuestions[assessment].findIndex(
        (q: SavedQuestion) => q.questionId === questionId
      );

      if (questionIndex === -1 && !isQuestionInAnyCollection) {
        // Question not saved anywhere, so save it to savedQuestions
        playSound("tap-checkbox-checked.wav");
        const newSavedQuestion: SavedQuestion = {
          questionId: questionId,
          externalId: question.question.external_id || null,
          ibn: question.question.ibn || null,
          plainQuestion: question.question,
          timestamp: new Date().toISOString(),
        };
        updatedSavedQuestions[assessment].push(newSavedQuestion);
        toast.success("Question saved!");
      } else {
        // Question is saved somewhere, so remove it completely
        playSound("tap-checkbox-unchecked.wav");

        // Remove from savedQuestions if it exists there
        if (questionIndex !== -1) {
          updatedSavedQuestions[assessment].splice(questionIndex, 1);
        }

        // Also remove from all collections
        const updatedCollections = { ...savedCollections };
        if (updatedCollections[assessment]) {
          updatedCollections[assessment] = updatedCollections[assessment].map(
            (collection) => ({
              ...collection,
              questionIds: collection.questionIds.filter(
                (id) => id !== questionId
              ),
              questionDetails:
                collection.questionDetails?.filter(
                  (detail) => detail.questionId !== questionId
                ) || [],
              updatedAt: new Date().toISOString(),
            })
          );
          setSavedCollections(updatedCollections);
        }
        toast.success("Question removed from saved and all collections!");
      }

      setSavedQuestions(updatedSavedQuestions);
    } catch (error) {
      console.error("Failed to save/remove question:", error);
      toast.error("Failed to save question");
    }
  };

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    try {
      const updatedCollections = { ...savedCollections };
      if (!updatedCollections[assessment]) {
        updatedCollections[assessment] = [];
      }

      const newCollection: SavedCollection = {
        id: `collection_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        name: newCollectionName.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questionIds: [],
        questionDetails: [], // Initialize empty questionDetails array
      };

      updatedCollections[assessment].push(newCollection);
      setSavedCollections(updatedCollections);
      setNewCollectionName("");
      setIsCreateDialogOpen(false);
      playSound("tap-checkbox-checked.wav");
      toast.success(`Collection "${newCollection.name}" created!`);
    } catch (error) {
      console.error("Failed to create collection:", error);
      toast.error("Failed to create collection");
    }
  };

  const handleDeleteCollection = (collectionId: string) => {
    try {
      const updatedCollections = { ...savedCollections };
      if (updatedCollections[assessment]) {
        const collectionToDelete = updatedCollections[assessment].find(
          (c) => c.id === collectionId
        );
        updatedCollections[assessment] = updatedCollections[assessment].filter(
          (collection) => collection.id !== collectionId
        );
        setSavedCollections(updatedCollections);
        playSound("tap-checkbox-unchecked.wav");
        toast.success(`Collection "${collectionToDelete?.name}" deleted!`);
      }
    } catch (error) {
      console.error("Failed to delete collection:", error);
      toast.error("Failed to delete collection");
    }
  };

  const handleRenameCollection = (collectionId: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      const updatedCollections = { ...savedCollections };
      if (updatedCollections[assessment]) {
        updatedCollections[assessment] = updatedCollections[assessment].map(
          (collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  name: newName.trim(),
                  updatedAt: new Date().toISOString(),
                }
              : collection
        );
        setSavedCollections(updatedCollections);
        setEditingCollection(null);
        playSound("button-pressed.wav");
        toast.success("Collection renamed!");
      }
    } catch (error) {
      console.error("Failed to rename collection:", error);
      toast.error("Failed to rename collection");
    }
  };

  const handleToggleQuestionInCollection = (collectionId: string) => {
    try {
      const updatedCollections = { ...savedCollections };
      const updatedSavedQuestions = { ...savedQuestions };

      if (updatedCollections[assessment]) {
        const collection = updatedCollections[assessment].find(
          (c) => c.id === collectionId
        );
        const questionExists = collection?.questionIds.includes(questionId);

        updatedCollections[assessment] = updatedCollections[assessment].map(
          (collection) => {
            if (collection.id === collectionId) {
              if (questionExists) {
                // Remove question from collection
                return {
                  ...collection,
                  questionIds: collection.questionIds.filter(
                    (id) => id !== questionId
                  ),
                  questionDetails:
                    collection.questionDetails?.filter(
                      (detail) => detail.questionId !== questionId
                    ) || [],
                  updatedAt: new Date().toISOString(),
                };
              } else {
                // Add question to collection
                return {
                  ...collection,
                  questionIds: [...collection.questionIds, questionId],
                  questionDetails: [
                    ...(collection.questionDetails || []),
                    {
                      questionId: questionId,
                      externalId: question.question.external_id || null,
                      ibn: question.question.ibn || null,
                    },
                  ],
                  updatedAt: new Date().toISOString(),
                };
              }
            }
            return collection;
          }
        );

        // If we're adding the question to a collection and it's not in savedQuestions, add it there too
        if (!questionExists) {
          // Initialize array if it doesn't exist
          if (!updatedSavedQuestions[assessment]) {
            updatedSavedQuestions[assessment] = [];
          }

          // Check if question is already in savedQuestions
          const questionIndex = updatedSavedQuestions[assessment].findIndex(
            (q: SavedQuestion) => q.questionId === questionId
          );

          if (questionIndex === -1) {
            const newSavedQuestion: SavedQuestion = {
              questionId: questionId,
              externalId: question.question.external_id || null,
              ibn: question.question.ibn || null,
              plainQuestion: question.question,
              timestamp: new Date().toISOString(),
            };
            updatedSavedQuestions[assessment].push(newSavedQuestion);
            setSavedQuestions(updatedSavedQuestions);
          }
        }

        setSavedCollections(updatedCollections);
        playSound("tap-checkbox-checked.wav");
      }
    } catch (error) {
      console.error("Failed to toggle question in collection:", error);
      toast.error("Failed to update collection");
    }
  };

  return (
    <div className="inline-flex rounded-xl md:rounded-2xl shadow-md hover:shadow-lg overflow-hidden">
      <Button
        variant="default"
        className={`flex cursor-pointer items-center gap-1 md:gap-2 font-bold py-2 md:py-3 px-3 md:px-6 border-b-4 transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 text-xs md:text-sm rounded-none ${
          actualIsQuestionSaved
            ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-700 hover:border-yellow-800"
            : "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-700 hover:border-yellow-800"
        }`}
        onClick={handleSaveClick}
      >
        <BookmarkIcon
          className={`w-3 h-3 md:w-4 md:h-4 duration-300 group-hover:rotate-12 ${
            actualIsQuestionSaved ? "fill-current" : ""
          }`}
        />
        <span className="font-medium hidden sm:inline">
          {actualIsQuestionSaved ? "Saved" : "Save"}
        </span>
      </Button>

      <HoverCard
        open={hoverCardOpen}
        onOpenChange={setHoverCardOpen}
        openDelay={100}
      >
        <HoverCardTrigger asChild>
          <Button
            className={`border-b-4 transform transition-all duration-200 active:translate-y-0.5 active:border-b-2 rounded-none border-l-0 ${
              actualIsQuestionSaved
                ? "bg-yellow-500 hover:bg-yellow-700 text-white border-yellow-800 hover:border-yellow-900"
                : "bg-yellow-500 hover:bg-yellow-700 text-white border-yellow-800 hover:border-yellow-900"
            }`}
            variant="default"
            size="icon"
            aria-label="Manage collections"
            onClick={(e) => {
              e.preventDefault();
              playSound("button-pressed.wav");
              setHoverCardOpen(!hoverCardOpen);
            }}
          >
            <EllipsisIcon size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </HoverCardTrigger>
        <HoverCardContent
          align="end"
          className="w-80 p-0 border-2 border-b-4 border-gray-300 rounded-xl md:rounded-2xl shadow-md hover:shadow-lg bg-white"
        >
          {/* Search Input */}
          <div className="p-4">
            <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden focus:border-blue-500  bg-gray-50 hover:bg-white">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search collections..."
                className="pl-10 transition-colors "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>

          {/* Collections List */}
          <div className="px-4 pt-2 pb-4 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-gray-800">
                Collections ({migratedCollections.length})
              </div>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-xs border-2 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-2 border-b-4 border-gray-300 rounded-xl shadow-lg">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-gray-800">
                      Create New Collection
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Collection name..."
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateCollection();
                        }
                      }}
                      className=""
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setNewCollectionName("");
                      }}
                      className="border-2 rounded-xl hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCollection}
                      disabled={!newCollectionName.trim()}
                      className="bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-700 rounded-xl"
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {filteredCollections.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                {migratedCollections.length === 0 ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                      <Folder className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="font-medium text-gray-600 mb-1">
                      No collections yet
                    </div>
                    <div className="text-xs text-gray-500">
                      Create one to organize your saved questions!
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    No collections match your search.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCollections.map((collection) => {
                  const isQuestionInCollection =
                    collection.questionIds.includes(questionId);
                  return (
                    <div
                      key={collection.id}
                      className="flex items-center gap-3 group p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        id={`${id}-${collection.id}`}
                        checked={isQuestionInCollection}
                        onCheckedChange={() =>
                          handleToggleQuestionInCollection(collection.id)
                        }
                        className="border-2 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />

                      {editingCollection?.id === collection.id ? (
                        <Input
                          value={editingCollection.name}
                          onChange={(e) =>
                            setEditingCollection({
                              ...editingCollection,
                              name: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleRenameCollection(
                                collection.id,
                                editingCollection.name
                              );
                            } else if (e.key === "Escape") {
                              setEditingCollection(null);
                            }
                          }}
                          onBlur={() =>
                            handleRenameCollection(
                              collection.id,
                              editingCollection.name
                            )
                          }
                          className="h-7 text-sm flex-1 border-2 rounded-lg focus:border-blue-500 focus:ring-0"
                          autoFocus
                        />
                      ) : (
                        <Label
                          htmlFor={`${id}-${collection.id}`}
                          className="font-medium flex-1 cursor-pointer truncate text-gray-700 text-sm"
                          title={collection.name}
                        >
                          {collection.name}
                        </Label>
                      )}

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-blue-100 rounded-lg"
                          onClick={() => setEditingCollection(collection)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          onClick={() => handleDeleteCollection(collection.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md min-w-0">
                        {collection.questionIds.length}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {questionCollections.length > 0 && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4"></div>
              <div className="px-4 py-3">
                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-2">
                    This question is saved in {questionCollections.length}{" "}
                    collection{questionCollections.length !== 1 ? "s" : ""}:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {questionCollections.map((collection) => (
                      <span
                        key={collection.id}
                        className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200"
                      >
                        {collection.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
